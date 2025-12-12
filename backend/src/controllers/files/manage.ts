import { Request, Response } from 'express';
import {
    updateFile,
    markFileDeleted,
    getFileById,
    deleteFilePermanent,
} from '../../models/files';
import * as fileStorage from '../../utils/fileStorage';
import { ValidationError, NotFoundError } from '../../middleware/errors';
import { recalculateParentFolderSizes } from '../../utils/folderSizeUtil';
import path from 'path';

/**
 * Update file metadata (original_name, is_public, metadata_json)
 */
export async function updateFileMetadata(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');
    const patch = req.body as Record<string, any>;
    const updated = updateFile(id, patch as any);
    if (!updated) throw new NotFoundError('File not found');
    return res.status(200).json({ file: updated });
}

/**
 * Soft-delete a file (set status = 'deleted')
 * Recalculates folder size to include soft-deleted file.
 */
export async function softDeleteFile(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileById(id);
    if (!file) throw new NotFoundError('File not found');

    const updated = markFileDeleted(id);
    if (!updated) throw new NotFoundError('File not found');

    // Recalculate folder size (soft-deleted files still count toward size)
    // Always recalculate, even for root folder
    const folderPath = path.dirname(file.storage_path) === '.' ? '' : path.dirname(file.storage_path);
    recalculateParentFolderSizes(folderPath);

    return res.status(200).json({ file: updated });
}

/**
 * Restore a soft-deleted file (set status = 'active')
 * Recalculates folder size (no change, but ensures consistency).
 */
export async function restoreFile(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileById(id);
    if (!file) throw new NotFoundError('File not found');

    const updated = updateFile(id, { status: 'active' });
    if (!updated) throw new NotFoundError('File not found');

    // Recalculate folder size
    // Always recalculate, even for root folder
    const folderPath = path.dirname(file.storage_path) === '.' ? '' : path.dirname(file.storage_path);
    recalculateParentFolderSizes(folderPath);

    return res.status(200).json({ file: updated });
}

/**
 * Permanently delete a file by DB id (removes from storage and DB)
 * Recalculates folder size after hard deletion.
 */
export async function permanentDeleteById(req: Request, res: Response) {
    const id = req.params.id;
    if (!id) throw new ValidationError('File id is required');

    const file = getFileById(id);
    if (!file) throw new NotFoundError('File not found');

    try {
        // Use storage_path (relative) to delete the file
        await fileStorage.deleteFile(file.storage_path);
    } catch (err) {
        throw err;
    }

    deleteFilePermanent(id);

    // Recalculate folder size after hard deletion
    // Always recalculate, even for root folder
    const folderPath = path.dirname(file.storage_path) === '.' ? '' : path.dirname(file.storage_path);
    recalculateParentFolderSizes(folderPath);

    return res.status(200).json({ message: 'File permanently deleted', id });
}
