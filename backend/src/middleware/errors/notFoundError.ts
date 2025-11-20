import AppError from './appError';

/**
 * NotFoundError — represents a 404 Not Found condition achieved through
 * business logic or route matching (useful to forward 404s into the error handler).
 */
export class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export default NotFoundError;
