import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { FILES_DIR } from '../config/env';
import { info, error as logError } from '../utils/logger';

/**
 * Upload Tracker Middleware
 * =========================
 * Tracks files written by multer and cleans them up if the request is aborted.
 * This prevents orphaned files when users cancel uploads mid-stream.
 *
 * How it works:
 * 1. Attaches an 'aborted' listener to the request
 * 2. When request completes normally, the listener is removed
 * 3. If aborted, deletes any files that multer wrote to disk
 */

/** Tracked upload info stored on request */
interface UploadTracker {
    aborted: boolean;
    cleaned: boolean;
}

/**
 * Deletes uploaded files from disk.
 * Used for cleanup on abort or error.
 */
async function cleanupUploadedFiles(req: Request): Promise<void> {
    const tracker = (req as any).__uploadTracker as UploadTracker | undefined;
    if (!tracker || tracker.cleaned) return;
    tracker.cleaned = true;

    const filesToDelete: string[] = [];

    // Single file upload
    if (req.file) {
        const folder = (req as any).sanitizedFolder || '';
        const storagePath = folder
            ? path.posix.join(folder, req.file.filename)
            : req.file.filename;
        filesToDelete.push(storagePath);
    }

    // Multi-file upload
    if (req.files && Array.isArray(req.files)) {
        const sanitizedFolders: string[] = (req as any).sanitizedFolders || [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const folder = sanitizedFolders[i] || '';
            const storagePath = folder
                ? path.posix.join(folder, file.filename)
                : file.filename;
            filesToDelete.push(storagePath);
        }
    }

    // Also delete any partial files tracked during upload parsing
    const partial = (req as any).__partialUploadedFiles as Array<{ filename: string; folder?: string; }> | undefined;
    if (partial && partial.length > 0) {
        for (const p of partial) {
            const storagePath = p.folder ? path.posix.join(p.folder, p.filename) : p.filename;
            filesToDelete.push(storagePath);
        }
    }

    // Delete files in parallel (filter out invalid entries and dedupe)
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
