import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { FILES_DIR } from '../config/env';
import { info, error as logError } from '../utils/logger';

/**
 * Upload Tracker Middleware
 * =========================
 * Tracks files and folders written by multer and cleans them up if the request is aborted.
 * This prevents orphaned files and empty folders when users cancel uploads mid-stream.
 * Supports both single/batch file uploads and folder uploads with subdirectory structure.
 *
 * How it works:
 * 1. Attaches an 'aborted' listener to the request
 * 2. When request completes normally, the listener is removed
 * 3. If aborted, deletes uploaded files and any created folder structures
 */

/** Tracked upload info stored on request */
interface UploadTracker {
    aborted: boolean;
    cleaned: boolean;
}

/**
 * Recursively deletes a directory and all its contents.
 * Used to clean up folder structures created during folder uploads.
 */
async function deleteDirectoryRecursive(dirPath: string): Promise<void> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                await deleteDirectoryRecursive(fullPath);
            } else {
                await fs.unlink(fullPath);
            }
        }
        await fs.rmdir(dirPath);
    } catch (err) {
        // Directory might not exist or is already deleted
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
            logError(`Failed to delete directory: ${dirPath}`, err);
        }
    }
}

/**
 * Deletes uploaded files and folder structures from disk.
 * Cleans up both individual files and any folders created during folder uploads.
 * Used for cleanup on abort or error.
 */
async function cleanupUploadedFiles(req: Request): Promise<void> {
    const tracker = (req as any).__uploadTracker as UploadTracker | undefined;
    if (!tracker || tracker.cleaned) return;
    tracker.cleaned = true;

    const filesToDelete: string[] = [];
    const foldersToDelete: Set<string> = new Set();

    // Single file upload
    if (req.file && req.file.filename) {
        const folder = (req as any).sanitizedFolder || '';
        const storagePath = folder
            ? path.posix.join(folder, req.file.filename)
            : req.file.filename;
        if (storagePath) filesToDelete.push(storagePath);
        if (folder) foldersToDelete.add(folder);
    }

    // Multi-file/folder upload
    if (req.files && Array.isArray(req.files)) {
        const sanitizedFolders: string[] = (req as any).sanitizedFolders || [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            if (!file || !file.filename) continue; // Skip invalid file entries
            const folder = sanitizedFolders[i] || '';
            const storagePath = folder
                ? path.posix.join(folder, file.filename)
                : file.filename;
            if (storagePath) filesToDelete.push(storagePath);
            if (folder) foldersToDelete.add(folder);
        }
    }

    // Track partial files during upload parsing
    const partial = (req as any).__partialUploadedFiles as Array<{ filename: string; folder?: string; }> | undefined;
    if (partial && partial.length > 0) {
        for (const p of partial) {
            if (!p || !p.filename) continue; // Skip invalid entries
            const storagePath = p.folder ? path.posix.join(p.folder, p.filename) : p.filename;
            if (storagePath) filesToDelete.push(storagePath);
            if (p.folder) foldersToDelete.add(p.folder);
        }
    }

    // Delete files first (filter out invalid entries and dedupe)
    const deduped = Array.from(new Set(filesToDelete.filter(Boolean) as string[]));
    if (deduped.length > 0) {
        info(`Cleaning up ${deduped.length} file(s) from aborted upload`, { files: deduped });
        await Promise.all(
            deduped.map(async (storagePath) => {
                try {
                    if (!storagePath) return;
                    const fullPath = path.join(FILES_DIR, storagePath);
                    await fs.unlink(fullPath);
                    info(`Deleted orphaned file: ${storagePath}`);
                } catch (err) {
                    // File might not exist yet or already deleted
                    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                        logError(`Failed to delete file: ${storagePath}`, err);
                    }
                }
            })
        );
    }

    // Delete empty folders created during upload (in reverse order from deepest to shallowest)
    if (foldersToDelete.size > 0) {
        const sortedFolders = Array.from(foldersToDelete).sort((a, b) => b.length - a.length);
        info(`Cleaning up ${sortedFolders.length} folder(s) from aborted upload`, { folders: sortedFolders });
        for (const folder of sortedFolders) {
            try {
                const fullPath = path.join(FILES_DIR, folder);
                await deleteDirectoryRecursive(fullPath);
                info(`Deleted orphaned folder: ${folder}`);
            } catch (err) {
                logError(`Failed to delete folder: ${folder}`, err);
            }
        }
    }
}

/**
 * Middleware to track uploads and cleanup on abort.
 * Must be placed AFTER multer middleware in the chain.
 */
export function uploadTracker(req: Request, res: Response, next: NextFunction): void {
    // Initialize tracker on request
    const tracker: UploadTracker = { aborted: false, cleaned: false };
    (req as any).__uploadTracker = tracker;

    // Handle client abort (connection closed before response sent)
    const onAborted = () => {
        tracker.aborted = true;
        info('Upload aborted by client');
        cleanupUploadedFiles(req).catch((err) => {
            logError('Cleanup after abort failed', err);
        });
    };

    // Handle close event (covers more edge cases)
    // Only trigger cleanup on close when request.aborted is true to avoid
    // removing files during normal, in-progress uploads.
    const onClose = () => {
        if ((req as any).aborted && !tracker.cleaned) {
            tracker.aborted = true;
            cleanupUploadedFiles(req).catch((err) => {
                logError('Cleanup after close failed', err);
            });
        }
    };

    req.on('aborted', onAborted);
    req.on('close', onClose);

    // Clean up listeners when response finishes
    res.on('finish', () => {
        req.removeListener('aborted', onAborted);
        req.removeListener('close', onClose);
    });

    next();
}

/**
 * Check if the current upload was aborted.
 * Controllers can use this to skip processing.
 */
export function isUploadAborted(req: Request): boolean {
    const tracker = (req as any).__uploadTracker as UploadTracker | undefined;
    return tracker?.aborted ?? false;
}

export default uploadTracker;
