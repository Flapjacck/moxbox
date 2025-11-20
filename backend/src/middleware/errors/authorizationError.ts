import AppError from './appError';

/**
 * AuthorizationError — thrown when an authenticated user attempts an action
 * they are not permitted to perform.
 */
export class AuthorizationError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export default AuthorizationError;
