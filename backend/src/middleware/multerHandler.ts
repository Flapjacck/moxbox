import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { FILES_DIR } from '../config/env';
import { ValidationError } from './errors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { sanitizeFolderPath, resolveSecurePath } from '../utils/pathSanitizer';

/**
 * multerHandler middleware
 * - Configures multer for local disk storage with subdirectory support
 * - Validates file size and allowed MIME types
 * - Stores files in FILES_DIR or subdirectories within it
 * - Generates unique filenames with UUID to avoid collisions
 */

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    // Text
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // Archives
    'application/zip',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
];

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
 * File filter callback for multer
 * - Validates MIME type against allowed list
 * - Rejects files with disallowed types
 */
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
): void => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file with a validation error
        cb(
            new ValidationError(
                `File type not allowed: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
            )
        );
    }
};

/**
 * Multer instance configured with:
 * - Local disk storage
 * - File size limit
 * - MIME type validation
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

export default upload;