import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { stat } from 'fs/promises';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError, NotFoundError } from '../middleware/errors';
import { info } from '../utils/logger';
import {
    createFile as createFileModel,
    getFileById as getFileByIdModel,
    listFiles as listFilesModel,
    bumpAccess as bumpAccessModel,
} from '../models/files';

/**
 * Controller: File
 * - Handles file upload, listing, download, and deletion
 * - Uses fileStorage utility for file system operations
 */

/**
 * POST /api/files/upload
 * Upload a new file to storage
 * 
 * @access Private (authenticated users)
 * @middleware multer - Handles multipart/form-data and file validation
 * @todo Add file metadata storage (owner, uploadDate, mimetype)
 */
export async function uploadFile(req: Request, res: Response) {
    // Multer middleware attaches the file to req.file
    const file = req.file;

    if (!file) {
        throw new ValidationError('No file provided');
    }

    // File is already saved by multer to FILES_DIR with unique name
    info('File uploaded successfully', { filename: file.filename, originalName: file.originalname });

    // Persist file metadata to DB
    try {
        // compute sha256 of uploaded file for integrity/duplicate checks
        const filePath = fileStorage.getFilePath(file.filename);
        const sha256 = await (async () => {
            const h = crypto.createHash('sha256');
            const stream = createReadStream(filePath);
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
            storagePath: filePath,
            ownerId: req.user?.id ?? null,
            isPublic: false,
        });

        return res.status(201).json({ message: 'File uploaded successfully', file: created });
    } catch (err) {
        // If DB insert fails, remove the stored file to avoid orphaned files
        try {
            await fileStorage.deleteFile(file.filename);
        } catch (delErr) {
            // Log cleanup failure, but don't mask the real error
            info('Cleanup failure: failed to delete file after DB error', { filename: file.filename });
        }
        throw err;
    }
}

/**
 * GET /api/files
 * List all files in storage
 * 
 * @access Private (authenticated users)
 * @todo Add pagination support (offset, limit)
 * @todo Add filtering by pattern, mimetype, owner
 * @todo Return metadata (size, uploadDate, owner, mimetype)
 */
export async function listFiles(req: Request, res: Response) {
    // Optional pattern filter from query params
    const pattern = req.query.pattern as string | undefined;
    const filter = pattern ? { pattern } : undefined;


    // Support optional query params for ownerId and isPublic (for now read from query)
    const ownerId = req.query.ownerId as string | undefined || req.user?.id;
    const isPublic = req.query.isPublic ? req.query.isPublic === 'true' : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const files = listFilesModel({ ownerId, isPublic, limit, offset });

    info('Files listed successfully', { count: files.length });

    return res.status(200).json({ files });
}

/**
 * GET /api/files/:name
 * Download/stream a file by name
 * 
 * @access Private (authenticated users)
 * @todo Add authorization check (only owner or admin)
 * @todo Add support for range requests (partial content)
 */
// _downloadFile by storedName removed. Use downloadFileById (DB-backed) instead.

/**
 * DELETE /api/files/:name
 * Delete a file from storage
 * 
 * @access Private (authenticated users)
 * @todo Add authorization check (only admin or file owner)
 */
// deleteFile by storedName removed. Use admin endpoints (id-based) for deletion.

/**
 * GET /api/files/:id (matches UUID id)
 * Download/stream a file by DB id
 */
export async function downloadFileById(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileByIdModel(id);
    if (!file) throw new NotFoundError('File not found');

    const filePath = file.storage_path;
    const stats = await stat(filePath);
    // Set headers and stream
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', file.mime_type ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
    // bump access, ignore errors
    try { bumpAccessModel(file.id); } catch (e) { /* ignore */ }
}
