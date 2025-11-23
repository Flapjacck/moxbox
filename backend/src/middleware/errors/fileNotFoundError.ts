import AppError from './appError';

/**
 * FileNotFoundError — represents a 404 condition specific to file operations
 * (e.g., requested file does not exist in storage).
 */
export class FileNotFoundError extends AppError {
    constructor(message = 'File not found') {
        super(message, 404, 'FILE_NOT_FOUND');
    }
}

export default FileNotFoundError;
