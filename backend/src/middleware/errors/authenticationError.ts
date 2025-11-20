import AppError from './appError';

/**
 * AuthenticationError — thrown when a user is unauthenticated.
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export default AuthenticationError;
