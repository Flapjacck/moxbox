import { Request, Response } from 'express';
import * as fileStorage from '../utils/fileStorage';
import { ValidationError } from '../middleware/errors';
import { info } from '../utils/logger';
import { sanitizeFolderPath } from '../utils/pathSanitizer';

/**
 * Controller: Folder
 * - Handles folder creation, renaming, deletion, and listing
 * - All paths are relative to FILES_DIR
 */

/**
 * POST /api/folders
 * Create a new folder within FILES_DIR.
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


    // Check if folder already exists before creating
    const fs = require('fs');
    const absPath = require('../utils/pathSanitizer').resolveSecurePath(require('../config/env').FILES_DIR, folderPath);
    if (fs.existsSync(absPath)) {
        // Throw a validation error with a clear message for the frontend
        throw new ValidationError('A folder with that name already exists in this location.');
    }

    await fileStorage.ensureDirectory(folderPath);

    info('Folder created', { folder: folderPath });

    return res.status(201).json({
        message: 'Folder created successfully',
        path: folderPath,
    });
}

/**
 * PATCH /api/folders/rename
 * Rename (move) a folder within FILES_DIR.
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

    info('Folder renamed', { from: oldPath, to: newPath });

    return res.status(200).json({
        message: 'Folder renamed successfully',
        oldPath,
        newPath,
    });
}

/**
 * DELETE /api/folders
 * Delete a folder (must be empty).
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

    info('Folder deleted', { folder: folderPath });

    return res.status(200).json({
        message: 'Folder deleted successfully',
        path: folderPath,
    });
}

/**
 * GET /api/folders/list
 * List contents (files and subfolders) of a directory.
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
    listFolderContents,
};
