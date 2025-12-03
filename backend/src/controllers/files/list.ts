import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import * as fileStorage from '../../utils/fileStorage';
import { ValidationError, NotFoundError } from '../../middleware/errors';
import { info } from '../../utils/logger';
import { getFileById, listFiles as listFilesModel, bumpAccess } from '../../models/files';

/**
 * GET /api/files
 * List files with optional filtering and pagination.
 */
export async function listFiles(req: Request, res: Response) {
    const ownerId = (req.query.ownerId as string) || req.user?.id;
    const isPublic = req.query.isPublic ? req.query.isPublic === 'true' : undefined;
    const status = (req.query.status as 'active' | 'deleted') || 'active';
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;

    const files = listFilesModel({ ownerId, isPublic, status, limit, offset });
    info('Files listed', { count: files.length, status });
    return res.status(200).json({ files });
}

/**
 * GET /api/files/id/:id
 * Download/stream a file by its database ID.
 */
export async function downloadFileById(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileById(id);
    if (!file) throw new NotFoundError('File not found');

    const absolutePath = fileStorage.getFilePath(file.storage_path);
    const stats = await stat(absolutePath);

    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', file.mime_type ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

    const stream = createReadStream(absolutePath);
    stream.pipe(res);

    try { bumpAccess(file.id); } catch { /* ignore */ }
}
