import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { FILES_DIR } from '../config/env';
import { ValidationError } from './errors';

/**
 * multerHandler middleware
 * - Configures multer for local disk storage
 * - Validates file size and allowed MIME types
 * - Stores files in the directory specified by FILES_DIR env var
 * - Generates unique filenames with timestamp prefix to avoid collisions
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
 * Configure multer disk storage
 * - destination: Save files to FILES_DIR
 * - filename: Generate unique names with timestamp prefix
 */
const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
        // Use the FILES_DIR from environment config
        cb(null, FILES_DIR);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        // Generate a unique filename: timestamp-originalname
        const uniqueSuffix = Date.now();
        const sanitizedName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}`);
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