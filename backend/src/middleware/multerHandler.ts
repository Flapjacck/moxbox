import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { FILES_DIR, UPLOAD_MAX_FILE_SIZE, UPLOAD_DISALLOWED_MIME_TYPES } from '../config/env';
import { ValidationError } from './errors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { sanitizeFolderPath, resolveSecurePath } from '../utils/pathSanitizer';

/**
 * multerHandler middleware
 * - Configures multer for local disk storage with subdirectory support
 * - Supports single-file and multi-file (folder) uploads
 * - Uses a BLACKLIST approach: blocks specific dangerous MIME types
 * - File size limit configurable via environment variables
 * - Stores files in FILES_DIR or subdirectories within it
 * - Generates unique filenames with UUID to avoid collisions
 * - Multi-file uploads preserve client-side folder structure via relativePath field
 */

/**
 * Extracts the folder portion from a relative path (e.g., "docs/notes/file.txt" -> "docs/notes").
 * Used for multi-file uploads where client sends file.webkitRelativePath.
 */
function extractFolderFromRelativePath(relativePath: string | undefined): string {
    if (!relativePath) return '';
    // Normalize separators and get directory portion
    const normalized = relativePath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash > 0 ? normalized.substring(0, lastSlash) : '';
}

/**
 * Configure multer disk storage with subdirectory support.
 * - destination: Resolves to FILES_DIR or FILES_DIR/<folder> based on request
 * - For multi-file uploads, reads per-file relativePath to compute destination
 * - filename: Generate unique names with UUID + original extension
 */
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        try {
            // For multi-file uploads, relativePaths is an array sent before files
            // We track which file index we're on via req.fileIndex
            const fileIndex = (req as any).fileIndex ?? 0;
            (req as any).fileIndex = fileIndex + 1;

            // Get per-file relativePath from array (batch) or single folder field
            const relativePaths = req.body?.relativePath;
            const folders = req.body?.folder;

            let rawFolder: string | undefined;

            if (Array.isArray(relativePaths) && relativePaths[fileIndex]) {
                // Multi-file upload: extract folder from relativePath
                rawFolder = extractFolderFromRelativePath(relativePaths[fileIndex]);
                // Combine with base folder if provided
                const baseFolder = Array.isArray(folders) ? folders[0] : folders;
                if (baseFolder) {
                    rawFolder = rawFolder ? `${baseFolder}/${rawFolder}` : baseFolder;
                }
            } else if (typeof relativePaths === 'string' && relativePaths) {
                // Single file with relativePath
                rawFolder = extractFolderFromRelativePath(relativePaths);
                if (folders) {
                    rawFolder = rawFolder ? `${folders}/${rawFolder}` : folders;
                }
            } else {
                // Fallback to folder field (single upload or no relativePath)
                rawFolder = Array.isArray(folders) ? folders[fileIndex] || folders[0] : folders;
            }

            const sanitizedFolder = sanitizeFolderPath(rawFolder);

            // Resolve and validate destination path
            const destPath = sanitizedFolder
                ? resolveSecurePath(FILES_DIR, sanitizedFolder)
                : FILES_DIR;

            // Ensure directory exists (sync for multer callback)
            fs.mkdirSync(destPath, { recursive: true });

            // Store sanitized folder per-file in an array for controller access
            if (!(req as any).sanitizedFolders) {
                (req as any).sanitizedFolders = [];
            }
            (req as any).sanitizedFolders.push(sanitizedFolder);

            // Keep backward compat: also set sanitizedFolder for single-file uploads
            (req as any).sanitizedFolder = sanitizedFolder;

            cb(null, destPath);
        } catch (err) {
            cb(err instanceof Error ? err : new Error('Invalid folder path'), '');
        }
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        // Generate a unique stored filename using random UUID + original extension
        const ext = path.extname(file.originalname) || '';
        const storedName = `${crypto.randomUUID()}${ext}`;
        cb(null, storedName);
    },
});

/**
 * File filter callback for multer (BLACKLIST approach)
 * - Rejects files if their MIME type is in the disallowed list
 * - Accepts all other file types
 * - This is a permissive approach suitable for personal/trusted environments
 */
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    // Normalize MIME type to lowercase for comparison
    const mimeType = file.mimetype.toLowerCase();

    // Check if the file's MIME type is in the blacklist
    if (UPLOAD_DISALLOWED_MIME_TYPES.includes(mimeType)) {
        // Reject the file with a validation error
        cb(
            new ValidationError(
                `File type not allowed: ${file.mimetype}. Blocked types: ${UPLOAD_DISALLOWED_MIME_TYPES.join(', ')}`
            )
        );
    } else {
        // Accept the file (not in blacklist)
        cb(null, true);
    }
};

/**
 * Multer instance configured with:
 * - Local disk storage
 * - File size limit (from UPLOAD_MAX_FILE_SIZE env var)
 * - MIME type blacklist validation (from UPLOAD_DISALLOWED_MIME_TYPES env var)
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: UPLOAD_MAX_FILE_SIZE,
    },
});

export default upload;