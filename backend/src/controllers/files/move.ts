import { Request, Response } from 'express';
import path from 'path';
import {
    getFileById,
    updateFile,
    getActiveFileByOriginalNameAndFolder,
    generateUniqueOriginalNameInFolder,
} from '../../models/files';
import { getFolderByPath } from '../../models/folders';
import { ValidationError, NotFoundError } from '../../middleware/errors';
import { recalculateParentFolderSizes } from '../../utils/folderSizeUtil';
import fileStorage from '../../utils/fileStorage';

/**
 * POST /api/files/:id/move
 * Move an existing file from its current folder to a destination folder.
 * Handles conflict detection and resolution via action param.
 * Recalculates folder sizes for source and destination.
 *
 * Request body:
 * - destinationPath: string - Target folder path (e.g., "projects/2024")
 * - action?: 'replace' | 'keep_both' - Conflict resolution (optional, defaults to error if conflict)
 *
 * Returns: Updated file object with new path
 */
export async function moveFile(req: Request, res: Response) {
    const fileId = req.params.id;
    if (!fileId) throw new ValidationError('File id is required');

    const { destinationPath, action } = req.body as {
        destinationPath?: string;
        action?: 'replace' | 'keep_both';
    };

    if (destinationPath === undefined) throw new ValidationError('destinationPath is required');

    // Fetch source file
    const file = getFileById(fileId);
    if (!file) throw new NotFoundError('File not found');

    // Prevent moving soft-deleted files
    if (file.status === 'deleted') {
        throw new ValidationError('Cannot move a file in Trash. Restore it first.');
    }

    // Verify ownership (implicit by querying with user context if needed)
    const userId = (req as any).user?.id;
    if (file.owner_id !== userId) {
        throw new NotFoundError('File not found');
    }

    // Verify destination folder exists (if not root)
    if (destinationPath) {
        const destFolder = getFolderByPath(destinationPath);
        if (!destFolder) {
            throw new ValidationError(
                `Destination folder '${destinationPath}' does not exist.`
            );
        }
        // Verify ownership of destination folder
        if (destFolder.owner_id !== userId) {
            throw new NotFoundError('Destination folder not found');
        }
    }

    const sourceFolderPath = path.posix.dirname(file.storage_path) === '.' ? '' : path.posix.dirname(file.storage_path);
    const fileName = file.original_name;
    const newStoragePath = destinationPath
        ? path.posix.join(destinationPath, path.posix.basename(file.storage_path))
        : path.posix.basename(file.storage_path);

    // Check for active file conflict in destination (excluding the file being moved)
    const activeConflict = getActiveFileByOriginalNameAndFolder(fileName, destinationPath || null, fileId);

    // Return 409 if conflict and no action specified
    if (activeConflict && !action) {
        return res.status(409).json({
            message: `A file named '${fileName}' already exists in the destination.`,
            conflict: { id: activeConflict.id, originalName: activeConflict.original_name },
        });
    }

    // Handle conflict by replacement
    if (action === 'replace' && activeConflict) {
        // Move physical file first (atomic operation)
        if (file.storage_path !== newStoragePath) {
            await fileStorage.ensureDirectory(destinationPath || '');
            await fileStorage.renameFile(file.storage_path, newStoragePath);
        }

        // Update existing conflict to take this file's data
        const updated = updateFile(activeConflict.id, {
            stored_name: file.stored_name,
            mime_type: file.mime_type,
            size: file.size,
            hash_sha256: file.hash_sha256,
            storage_path: newStoragePath,
        });

        // Recalculate both source and destination folder sizes
        recalculateParentFolderSizes(sourceFolderPath);
        recalculateParentFolderSizes(destinationPath || '');

        return res.status(200).json({ file: updated });
    }

    // Handle conflict by renaming (keep_both)
    let finalOriginalName = fileName;
    if (action === 'keep_both' && activeConflict) {
        finalOriginalName = generateUniqueOriginalNameInFolder(fileName, destinationPath || null);
    }

    // Move physical file first (atomic operation)
    if (file.storage_path !== newStoragePath) {
        await fileStorage.ensureDirectory(destinationPath || '');
        await fileStorage.renameFile(file.storage_path, newStoragePath);
    }

    // Update file with new path and possibly new name
    const updated = updateFile(fileId, {
        original_name: finalOriginalName,
        storage_path: newStoragePath,
    });

    if (!updated) throw new NotFoundError('File not found');

    // Recalculate folder sizes for source and destination
    recalculateParentFolderSizes(sourceFolderPath);
    recalculateParentFolderSizes(destinationPath || '');

    return res.status(200).json({ file: updated });
}
