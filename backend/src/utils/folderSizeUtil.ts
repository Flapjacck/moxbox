import { getDatabase } from '../config/db';
import { updateFolderSize, getFolderByPath, createFolder } from '../models/folders';
import * as logger from './logger';

/**
 * folderSizeUtil.ts
 * - Utilities for calculating and updating folder sizes based on file contents.
 * - Soft-deleted files are included in size until hard-deleted.
 * - Called on file upload, deletion, and moves.
 */

/**
 * calculateFolderSizeFromFiles
 * - Calculate the total size of all files (active + soft-deleted) within a folder.
 * - Query files table where storage_path matches the folder path prefix.
 * - Returns the total size in bytes.
 */
export function calculateFolderSizeFromFiles(folderPath: string): number {
    const db = getDatabase();

    // Match files where storage_path starts with "folderPath/" (but not parent folders)
    // Also match files directly in the folder (no subdirs) for root
    const stmt = db.prepare(`
        SELECT COALESCE(SUM(size), 0) as total
        FROM files
        WHERE storage_path LIKE ? OR (storage_path = ?)
        AND status IN ('active', 'deleted');
    `);

    const result = stmt.get(`${folderPath}/%`, folderPath) as { total: number };
    return result?.total ?? 0;
}

/**
 * ensureFolderExists
 * - Check if folder exists in DB, create if not.
 * - Used when files are uploaded to a folder before folder creation endpoint is called.
 * - Returns the folder record ID.
 */
function ensureFolderExists(folderPath: string, ownerId?: string | null): string {
    let folder = getFolderByPath(folderPath);
    if (!folder) {
        folder = createFolder({ path: folderPath, ownerId });
        logger.info('Auto-created folder DB record', { folder: folderPath });
    }
    return folder.id;
}

/**
 * recalculateFolderSize
 * - Look up the folder by path, compute its new size from files, and update DB.
 * - Logs the operation for debugging.
 * - Safe to call even if folder doesn't exist in DB (will just return null).
 * - Returns the new size in bytes, or null if folder not found.
 */
export function recalculateFolderSize(folderPath: string): number | null {
    try {
        const folder = getFolderByPath(folderPath);
        if (!folder) {
            // Folder not in DB yet, which is fine during creation
            return null;
        }

        const newSize = calculateFolderSizeFromFiles(folderPath);
        const updated = updateFolderSize(folder.id, newSize);

        logger.info('Folder size recalculated', { folder: folderPath, size: newSize });
        return updated?.size ?? newSize;
    } catch (err) {
        logger.error(`Failed to recalculate folder size for ${folderPath}`, err);
        return null;
    }
}

/**
 * recalculateParentFolderSizes
 * - Recalculate sizes for the folder and all parent folders up the tree.
 * - Useful after file operations to ensure all ancestors are updated.
 * - Example: uploading to "projects/2024/docs" updates sizes for
 *   "projects/2024/docs", "projects/2024", and "projects".
 */
export function recalculateParentFolderSizes(folderPath: string): void {
    const parts = folderPath.split('/').filter(p => p.length > 0);

    // Recalculate the folder itself and all parent folders
    for (let i = parts.length; i > 0; i--) {
        const parentPath = parts.slice(0, i).join('/');
        recalculateFolderSize(parentPath);
    }
}

/**
 * ensureAndRecalculateFolderSizes
 * - Ensure folder DB records exist for the given path and all parents.
 * - Then recalculate sizes for all of them.
 * - Used when files are uploaded before folder creation endpoint is called.
 */
export function ensureAndRecalculateFolderSizes(folderPath: string, ownerId?: string | null): void {
    const parts = folderPath.split('/').filter(p => p.length > 0);

    // Ensure all folders in the path exist in the DB
    for (let i = 1; i <= parts.length; i++) {
        const currentPath = parts.slice(0, i).join('/');
        ensureFolderExists(currentPath, ownerId);
    }

    // Then recalculate sizes for all of them
    recalculateParentFolderSizes(folderPath);
}

export default {
    calculateFolderSizeFromFiles,
    recalculateFolderSize,
    recalculateParentFolderSizes,
    ensureAndRecalculateFolderSizes,
};
