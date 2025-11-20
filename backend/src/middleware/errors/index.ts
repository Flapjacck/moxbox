/*
 * Central exports for the `errors/` folder.
 * This lets other modules import errors from `middleware/errors` via named imports.
 */
export { default as AppError } from './appError';
export { AppError as _AppError } from './appError'; // named alias for typed imports if needed
export { default as ValidationError } from './validationError';
export { ValidationError as _ValidationError } from './validationError';
export { default as AuthenticationError } from './authenticationError';
export { AuthenticationError as _AuthenticationError } from './authenticationError';
export { default as AuthorizationError } from './authorizationError';
export { AuthorizationError as _AuthorizationError } from './authorizationError';
export { default as NotFoundError } from './notFoundError';
export { NotFoundError as _NotFoundError } from './notFoundError';

// Local imports used to build a friendly default export object below.
import AppError from './appError';
import ValidationError from './validationError';
import AuthenticationError from './authenticationError';
import AuthorizationError from './authorizationError';
import NotFoundError from './notFoundError';

export default {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
};
