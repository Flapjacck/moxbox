import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { error as logError } from '../utils/logger';
import { config } from '../config/env';

/**
 * Centralized error-handling middleware
 *
 * - Accepts both operational AppError instances and unexpected errors
 * - Converts Zod validation errors into ValidationError responses
 * - Detects token errors from `jsonwebtoken` and maps to 401
 */
export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    // Reference the `_next` parameter to avoid an `no-unused-vars` warning while
    // preserving the Express error middleware signature. Using `void` keeps the
    // reference side-effect free.
    void _next;
    // Default values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal Server Error';
    let details: unknown | undefined = undefined;

    // Map our known AppError types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code ?? code;
        message = err.message;
        details = err.details;
    }
    // Zod validation errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Invalid request input';
        details = err.issues;
    }
    // jwt Token errors from `jsonwebtoken` come through with `name` fields
    else if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = (err as any).message || 'Invalid token';
    }
    else if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = (err as any).message || 'Token expired';
    }
    else if (err && typeof err === 'object' && 'name' in err) {
        // Non-operational or unknown error; let it default to 500, but preserve message if set
        message = (err as any).message ?? message;
    }

    const responseBody: Record<string, unknown> = {
        status: 'error',
        message,
        code,
    };

    if (details) {
        responseBody.details = details;
    }

    // Include stack trace in non-production environments to help debugging
    if (config.nodeEnv !== 'production') {
        responseBody.stack = (err instanceof Error && err.stack) || undefined;
    }

    // Log the error for server-side debugging. Include method + path and
    // additional properties where available.
    try {
        logError('Handler caught error', { method: req.method, path: req.originalUrl, statusCode, code, message, details, stack: (err instanceof Error && err.stack) });
    } catch (e) {
        // The logger should never crash the server — swallow exceptions from the logger.
        // Avoid `console` to adhere to linting rules — write directly to stderr
        // as a minimal, reliable fallback that won't attempt to use the failing
        // logger again.
        try {
            process.stderr.write(`Logger failed while recording an error: ${String(e)}\n`);
        } catch {
            // If even writing to stderr fails (very unlikely), there's nothing we can do.
        }
    }

    // Set content type explicitly and send JSON
    res.status(statusCode).json(responseBody);
};

export default errorHandler;
