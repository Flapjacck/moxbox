import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { stat } from 'fs/promises';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError, NotFoundError } from '../middleware/errors';
import { info } from '../utils/logger';
import {
    createFile as createFileModel,
    getFileById as getFileByIdModel,
    listFiles as listFilesModel,
    bumpAccess as bumpAccessModel,
    getDeletedFileByOriginalNameAndFolder as getDeletedFileByOriginalNameAndFolderModel,
} from '../models/files';

/**
 * Controller: File
 * - Handles file upload, listing, download, and deletion
 * - Supports storing files in subdirectories within FILES_DIR
 */

/**
 * POST /api/files/upload
 * Upload a new file to storage, optionally in a subdirectory.
 * 
 * @access Private (authenticated users)
 * @middleware multer - Handles multipart/form-data and file validation
 * @body folder - Optional subdirectory path (e.g., "projects/2024")
 */
export async function uploadFile(req: Request, res: Response) {
    // Multer middleware attaches the file to req.file
    const file = req.file;

    if (!file) {
        throw new ValidationError('No file provided');
    }

    // Get sanitized folder from multer middleware (set in destination callback)
    const sanitizedFolder = (req as any).sanitizedFolder as string || '';

    // Build relative storage path: "folder/filename" or just "filename"
    const storagePath = sanitizedFolder
        ? path.posix.join(sanitizedFolder, file.filename)
        : file.filename;

    info('File uploaded (received) — checking for conflicts', {
        filename: file.filename,
        originalName: file.originalname,
        folder: sanitizedFolder || '(root)',
    });

    // If a deleted (trashed) file with the same original name exists in the
    // same target folder, block this upload and return a friendly ValidationError.
    const trashedConflict = getDeletedFileByOriginalNameAndFolderModel(file.originalname, sanitizedFolder || null);
    if (trashedConflict) {
        // Remove the uploaded file from storage to avoid orphaned files; log any cleanup failure
        try { await fileStorage.deleteFile(storagePath); } catch (delErr) { info('Cleanup failure: failed to delete uploaded file after blocked upload (trashed duplicate)', { storagePath }); }
        info('Upload blocked: file exists in trash', { originalName: file.originalname, folder: sanitizedFolder || '(root)', trashedId: trashedConflict.id });
        throw new ValidationError(`Upload blocked: a file named '${file.originalname}' already exists in your Trash. Restore it from Trash, or rename the file and try again.`);
    }

    // Persist file metadata to DB
    try {
        // Compute sha256 of uploaded file for integrity/duplicate checks
        const absolutePath = fileStorage.getFilePath(storagePath);
        const sha256 = await (async () => {
            const h = crypto.createHash('sha256');
            const stream = createReadStream(absolutePath);
            for await (const chunk of stream) {
                h.update(chunk);
            }
            return h.digest('hex');
        })();

        const created = createFileModel({
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            hashSha256: sha256,
            storagePath: storagePath, // Relative path for portability
            ownerId: req.user?.id ?? null,
            isPublic: false,
        });

        return res.status(201).json({ message: 'File uploaded successfully', file: created });
    } catch (err) {
        // If DB insert fails, remove the stored file to avoid orphaned files
        try {
            await fileStorage.deleteFile(storagePath);
        } catch (delErr) {
            // Log cleanup failure, but don't mask the real error
            info('Cleanup failure: failed to delete file after DB error', { storagePath });
        }
        throw err;
    }
}

/**
 * GET /api/files
 * List all files in storage
 * 
 * @access Private (authenticated users)
 * @query status - Filter by status ('active' or 'deleted'), defaults to 'active'
 * @query ownerId - Filter by owner (defaults to current user)
 * @query isPublic - Filter by public visibility
 * @query limit - Pagination limit
 * @query offset - Pagination offset
 */
export async function listFiles(req: Request, res: Response) {
    // Support optional query params for filtering
    const ownerId = req.query.ownerId as string | undefined || req.user?.id;
    const isPublic = req.query.isPublic ? req.query.isPublic === 'true' : undefined;
    const status = (req.query.status as 'active' | 'deleted') || 'active';
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const files = listFilesModel({ ownerId, isPublic, status, limit, offset });

    info('Files listed successfully', { count: files.length, status });

    return res.status(200).json({ files });
}

/**
 * GET /api/files/:id (matches UUID id)
 * Download/stream a file by DB id
 */
export async function downloadFileById(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileByIdModel(id);
    if (!file) throw new NotFoundError('File not found');

    // Resolve relative storage_path to absolute filesystem path
    const absolutePath = fileStorage.getFilePath(file.storage_path);
    const stats = await stat(absolutePath);

    // Set headers and stream
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', file.mime_type ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

    const fileStream = createReadStream(absolutePath);
    fileStream.pipe(res);

    // Bump access, ignore errors
    try { bumpAccessModel(file.id); } catch (e) { /* ignore */ }
}
