import AppError from './appError';

/**
 * ValidationError — wrapper for request validation problems (e.g., zod)
 */
export class ValidationError extends AppError {
    constructor(message = 'Validation Error', details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export default ValidationError;
