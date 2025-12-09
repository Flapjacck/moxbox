import { Request, Response } from 'express';
import path from 'path';
import { isUploadAborted } from '../../middleware/uploadTracker';
import * as fileStorage from '../../utils/fileStorage';
import { computeSha256 } from '../../utils/fileHash';
import { ValidationError } from '../../middleware/errors';
import { info } from '../../utils/logger';
import {
    createFile,
    getDeletedFileByOriginalNameAndFolder,
    getActiveFileByOriginalNameAndFolder,
    generateUniqueOriginalNameInFolder,
    updateFile,
} from '../../models/files';
import { ensureAndRecalculateFolderSizes } from '../../utils/folderSizeUtil';
import type { BatchFileResult, ConflictInfo } from './types';

/**
 * Check all files for conflicts before processing.
 * Returns arrays of trashed and active conflicts.
 */
function detectConflicts(
    files: Express.Multer.File[],
    sanitizedFolders: string[]
): { trashedConflicts: string[]; activeConflicts: ConflictInfo[] } {
    const trashedConflicts: string[] = [];
    const activeConflicts: ConflictInfo[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folder = sanitizedFolders[i] || '';

        const trashed = getDeletedFileByOriginalNameAndFolder(file.originalname, folder || null);
        if (trashed) {
            trashedConflicts.push(file.originalname);
            continue;
        }

        const active = getActiveFileByOriginalNameAndFolder(file.originalname, folder || null);
        if (active) {
            activeConflicts.push({
                originalName: file.originalname,
                existingFileId: active.id,
                folder,
            });
        }
    }

    return { trashedConflicts, activeConflicts };
}

/** Cleanup uploaded files on conflict/error */
async function cleanupFiles(files: Express.Multer.File[], sanitizedFolders: string[]) {
    for (let i = 0; i < files.length; i++) {
        const folder = sanitizedFolders[i] || '';
        const storagePath = folder
            ? path.posix.join(folder, files[i].filename)
            : files[i].filename;
        try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
    }
}

/**
 * POST /api/files/upload/batch
 * Upload multiple files, preserving folder structure.
 * Returns 409 with conflicts if action not specified.
 */
export async function uploadFiles(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) throw new ValidationError('No files provided');

    const sanitizedFolders: string[] = (req as any).sanitizedFolders || [];
    const action = req.body?.action as 'replace' | 'keep_both' | undefined;

    info('Batch upload received', { fileCount: files.length, action: action || 'none' });

    // If the request was aborted by the client, ensure we don't proceed
    if (isUploadAborted(req)) {
        try { await cleanupFiles(files, sanitizedFolders); } catch { /* ignore */ }
        return res.status(499).json({ message: 'Upload cancelled' });
    }

    // Check conflicts if no action specified
    if (!action) {
        const { trashedConflicts, activeConflicts } = detectConflicts(files, sanitizedFolders);

        if (trashedConflicts.length > 0) {
            await cleanupFiles(files, sanitizedFolders);
            return res.status(409).json({
                message: 'Files exist in Trash. Restore or delete them first.',
                trashedConflicts,
            });
        }

        if (activeConflicts.length > 0) {
            await cleanupFiles(files, sanitizedFolders);
            return res.status(409).json({
                message: `${activeConflicts.length} file(s) already exist.`,
                conflicts: activeConflicts,
                totalFiles: files.length,
            });
        }
    }

    // Process files
    const results: BatchFileResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const folder = sanitizedFolders[i] || '';
        const storagePath = folder ? path.posix.join(folder, file.filename) : file.filename;

        try {
            const result = await processFile(file, folder, storagePath, action, req.user?.id);
            results.push(result);
            successCount++;
        } catch (err) {
            try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
            results.push({
                originalName: file.originalname,
                storagePath,
                success: false,
                message: 'Upload failed',
                error: err instanceof Error ? err.message : 'Unknown error',
            });
            failureCount++;
        }
    }

    info('Batch upload completed', { successCount, failureCount });

    // Ensure folder DB records exist and recalculate sizes for all affected folders
    // This handles cases where files are uploaded before folder creation endpoint is called
    const affectedFolders = new Set(sanitizedFolders.filter(f => f && f.length > 0));
    affectedFolders.forEach(folder => {
        ensureAndRecalculateFolderSizes(folder, req.user?.id ?? null);
    });

    return res.status(200).json({
        message: `Uploaded: ${successCount} succeeded, ${failureCount} failed`,
        totalCount: files.length,
        successCount,
        failureCount,
        results,
    });
}

/** Process a single file in batch upload */
async function processFile(
    file: Express.Multer.File,
    folder: string,
    storagePath: string,
    action: 'replace' | 'keep_both' | undefined,
    ownerId?: string
): Promise<BatchFileResult> {
    const activeConflict = getActiveFileByOriginalNameAndFolder(file.originalname, folder || null);
    const absolutePath = fileStorage.getFilePath(storagePath);
    const sha256 = await computeSha256(absolutePath);

    if (activeConflict && action === 'replace') {
        const oldPath = activeConflict.storage_path;
        const updated = updateFile(activeConflict.id, {
            stored_name: file.filename,
            mime_type: file.mimetype,
            size: file.size,
            hash_sha256: sha256,
            storage_path: storagePath,
            owner_id: ownerId ?? null,
        });
        if (oldPath && oldPath !== storagePath) {
            try { await fileStorage.deleteFile(oldPath); } catch { /* ignore */ }
        }
        return { originalName: file.originalname, storagePath, success: true, message: 'Replaced', fileId: updated?.id };
    }

    if (activeConflict && action === 'keep_both') {
        const displayName = generateUniqueOriginalNameInFolder(file.originalname, folder || null);
        const created = createFile({
            originalName: displayName, storedName: file.filename, mimeType: file.mimetype,
            size: file.size, hashSha256: sha256, storagePath, ownerId: ownerId ?? null, isPublic: false,
        });
        return { originalName: displayName, storagePath, success: true, message: 'Renamed', fileId: created.id };
    }

    const created = createFile({
        originalName: file.originalname, storedName: file.filename, mimeType: file.mimetype,
        size: file.size, hashSha256: sha256, storagePath, ownerId: ownerId ?? null, isPublic: false,
    });
    return { originalName: file.originalname, storagePath, success: true, message: 'Uploaded', fileId: created.id };
}
