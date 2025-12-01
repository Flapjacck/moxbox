import { Request, Response } from 'express';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError, NotFoundError } from '../middleware/errors';
import {
    getFileById as getFileByIdModel,
    updateFile as updateFileModel,
    markFileDeleted as markFileDeletedModel,
    deleteFilePermanent as deleteFilePermanentModel,
} from '../models/files';

/**
 * PATCH /api/files/:id
 * Update file metadata
 */
export async function updateFileMetadata(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');
    const patch = req.body as Record<string, any>;
    const updated = updateFileModel(id, patch as any);
    if (!updated) throw new NotFoundError('File not found');
    return res.status(200).json({ file: updated });
}

/**
 * POST /api/files/:id/soft-delete
 */
export async function softDeleteFile(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');
    const updated = markFileDeletedModel(id);
    if (!updated) throw new NotFoundError('File not found');
    return res.status(200).json({ file: updated });
}

/**
 * POST /api/files/:id/restore — restore soft-deleted file
 */
export async function restoreFile(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');
    const updated = updateFileModel(id, { status: 'active' });
    if (!updated) throw new NotFoundError('File not found');
    return res.status(200).json({ file: updated });
}

/**
 * DELETE /api/files/:id/permanent
 * Permanently delete by id: delete storage file, then DB row
 */
export async function permanentDeleteById(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');
    const file = getFileByIdModel(id);
    if (!file) throw new NotFoundError('File not found');

    try {
        await fileStorage.deleteFile(file.stored_name);
    } catch (err) {
        // if storage deletion fails, return the error
        throw err;
    }

    deleteFilePermanentModel(id);
    return res.status(200).json({ message: 'File permanently deleted', id });
}

export default {
    updateFileMetadata,
    softDeleteFile,
    restoreFile,
    permanentDeleteById,
};
