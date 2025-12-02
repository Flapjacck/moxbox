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
 * - Uses a BLACKLIST approach: blocks specific dangerous MIME types, allows everything else
 * - File size limit and disallowed types are configurable via environment variables
 * - Stores files in FILES_DIR or subdirectories within it
 * - Generates unique filenames with UUID to avoid collisions
 */
/**
 * Configure multer disk storage with subdirectory support.
 * - destination: Resolves to FILES_DIR or FILES_DIR/<folder> based on request
 * - filename: Generate unique names with UUID + original extension
 */
const storage = multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb) => {
        try {
            // Get folder from request body (multipart field)
            const rawFolder = req.body?.folder as string | undefined;
            const sanitizedFolder = sanitizeFolderPath(rawFolder);

            // Resolve and validate destination path
            const destPath = sanitizedFolder
                ? resolveSecurePath(FILES_DIR, sanitizedFolder)
                : FILES_DIR;

            // Ensure directory exists (sync for multer callback)
            fs.mkdirSync(destPath, { recursive: true });

            // Store sanitized folder in request for controller access
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