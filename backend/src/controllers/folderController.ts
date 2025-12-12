import { Request, Response } from 'express';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError } from '../middleware/errors';
import { info } from '../utils/logger';
import { sanitizeFolderPath } from '../utils/pathSanitizer';
import {
    createFolder as createFolderRecord,
    deleteFolderByPath,
    getFolderByPath,
} from '../models/folders';
import { recalculateFolderSize, recalculateParentFolderSizes } from '../utils/folderSizeUtil';

/**
 * Controller: Folder
 * - Handles folder creation, renaming, deletion, and listing
 * - All paths are relative to FILES_DIR
 * - Maintains folder size metadata in DB via folderSizeUtil
 */

/**
 * POST /api/folders
 * Create a new folder within FILES_DIR.
 * Creates both the filesystem directory and a DB record with size = 0.
 * Immediately recalculates size if files already exist in the folder.
 *
 * @body path - Relative folder path to create (e.g., "projects/2024")
 */
export async function createFolder(req: Request, res: Response) {
    const rawPath = req.body?.path as string | undefined;

    if (!rawPath) {
        throw new ValidationError('Folder path is required');
    }

    const folderPath = sanitizeFolderPath(rawPath);
    if (!folderPath) {
        throw new ValidationError('Invalid folder path');
    }

    // Check if folder already exists on filesystem
    const fs = require('fs');
    const absPath = require('../utils/pathSanitizer').resolveSecurePath(require('../config/env').FILES_DIR, folderPath);
    if (fs.existsSync(absPath)) {
        throw new ValidationError('A folder with that name already exists in this location.');
    }

    // Create filesystem directory
    await fileStorage.ensureDirectory(folderPath);

    // Create DB record with size = 0
    const folderRecord = createFolderRecord({
        path: folderPath,
        ownerId: req.user?.id ?? null,
    });

    // Immediately recalculate size in case files were already uploaded to this folder
    // (happens during batch folder uploads before folder creation endpoint is called)
    const updatedSize = recalculateFolderSize(folderPath);

    info('Folder created', { folder: folderPath, id: folderRecord.id, size: updatedSize ?? 0 });

    return res.status(201).json({
        message: 'Folder created successfully',
        path: folderPath,
        size: updatedSize ?? 0,
    });
}

/**
 * PATCH /api/folders/rename
 * Rename (move) a folder within FILES_DIR and update DB path.
 *
 * @body oldPath - Current relative folder path
 * @body newPath - New relative folder path
 */
export async function renameFolder(req: Request, res: Response) {
    const rawOldPath = req.body?.oldPath as string | undefined;
    const rawNewPath = req.body?.newPath as string | undefined;

    if (!rawOldPath || !rawNewPath) {
        throw new ValidationError('Both oldPath and newPath are required');
    }

    const oldPath = sanitizeFolderPath(rawOldPath);
    const newPath = sanitizeFolderPath(rawNewPath);

    if (!oldPath || !newPath) {
        throw new ValidationError('Invalid folder path');
    }

    await fileStorage.renameFolder(oldPath, newPath);

    // Update DB: delete old folder record, create new one, recalculate parent sizes
    deleteFolderByPath(oldPath);
    const folderRecord = createFolderRecord({
        path: newPath,
        ownerId: req.user?.id ?? null,
    });

    // Recalculate parent folder sizes for both old and new paths
    const oldParent = oldPath.split('/').slice(0, -1).join('/');
    if (oldParent) recalculateParentFolderSizes(oldParent);
    recalculateParentFolderSizes(newPath);

    info('Folder renamed', { from: oldPath, to: newPath, id: folderRecord.id });

    return res.status(200).json({
        message: 'Folder renamed successfully',
        oldPath,
        newPath,
        size: folderRecord.size,
    });
}

/**
 * DELETE /api/folders
 * Delete a folder (must be empty).
 * Removes both the filesystem directory and its DB record.
 *
 * @body path - Relative folder path to delete
 */
export async function deleteFolder(req: Request, res: Response) {
    const rawPath = req.body?.path as string | undefined;

    if (!rawPath) {
        throw new ValidationError('Folder path is required');
    }

    const folderPath = sanitizeFolderPath(rawPath);
    if (!folderPath) {
        throw new ValidationError('Invalid folder path (cannot delete root)');
    }

    await fileStorage.deleteFolder(folderPath);

    // Remove DB record
    deleteFolderByPath(folderPath);

    // Recalculate parent folder sizes
    const parentPath = folderPath.split('/').slice(0, -1).join('/');
    if (parentPath) recalculateParentFolderSizes(parentPath);

    info('Folder deleted', { folder: folderPath });

    return res.status(200).json({
        message: 'Folder deleted successfully',
        path: folderPath,
    });
}
/**
 * GET /api/folders/root
 * Get root folder size info (space used at root level).
 * Returns the cached size of all top-level files.
 */
export async function getRootFolderInfo(req: Request, res: Response) {
    const rootFolder = getFolderByPath('');
    const size = rootFolder?.size ?? 0;

    info('Root folder info retrieved', { size });

    return res.status(200).json({
        path: '/',
        size,
    });
}

/**
 * GET /api/folders/list
 * List contents (files and subfolders) of a directory.
 * Folder entries include size from DB.
 *
 * @query path - Relative folder path (empty or omitted = root)
 */
export async function listFolderContents(req: Request, res: Response) {
    const rawPath = (req.query?.path as string) || '';
    const folderPath = sanitizeFolderPath(rawPath);

    const contents = await fileStorage.listDirectoryContents(folderPath);

    info('Folder contents listed', { folder: folderPath || '(root)', count: contents.length });

    return res.status(200).json({
        path: folderPath || '/',
        contents,
    });
}

export default {
    createFolder,
    renameFolder,
    deleteFolder,
    getRootFolderInfo,
    listFolderContents,
};
