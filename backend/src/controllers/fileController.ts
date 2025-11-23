import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError } from '../middleware/errors';
import { info } from '../utils/logger';

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

    return res.status(201).json({
        message: 'File uploaded successfully',
        filename: file.filename,
        path: fileStorage.getFilePath(file.filename),
    });
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

    const files = await fileStorage.listFiles(filter);

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
export async function downloadFile(req: Request, res: Response) {
    const filename = req.params.name;

    if (!filename) {
        throw new ValidationError('Filename is required');
    }

    // Get file path and verify it exists
    const filePath = fileStorage.getFilePath(filename);
    const fileStats = await stat(filePath);

    // Stream the file to the client (inline, not as attachment)
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);

    info('File download initiated', { filename });
}

/**
 * DELETE /api/files/:name
 * Delete a file from storage
 * 
 * @access Private (authenticated users)
 * @todo Add authorization check (only admin or file owner)
 */
export async function deleteFile(req: Request, res: Response) {
    const filename = req.params.name;

    if (!filename) {
        throw new ValidationError('Filename is required');
    }

    await fileStorage.deleteFile(filename);

    info('File deleted successfully', { filename });

    return res.status(200).json({ message: 'File deleted successfully', filename });
}