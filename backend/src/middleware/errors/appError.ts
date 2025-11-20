/**
 * AppError — base custom error class for application-specific errors
 *
 * Use this as the base for any domain-specific errors so the centralized
 * error handling middleware (`errorHandler`) can easily identify operational
 * errors and map them to appropriate HTTP responses.
 */
export class AppError extends Error {
    public statusCode: number;
    public code?: string;
    public details?: unknown;
    public isOperational: boolean;

    constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true; // mark as an expected, operational error
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
