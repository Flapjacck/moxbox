import AppError from './appError';

/**
 * FileStorageError — represents errors during file storage operations
 * (e.g., file system errors, permission issues, disk space).
 */
export class FileStorageError extends AppError {
    constructor(message = 'File storage operation failed') {
        super(message, 500, 'FILE_STORAGE_ERROR');
    }
}

export default FileStorageError;
