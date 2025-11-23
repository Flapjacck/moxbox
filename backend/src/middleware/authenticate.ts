import { NextFunction, Request, Response } from 'express';
import { AuthenticationError } from './errors';
import { verifyToken } from '../utils/token';
import type { UserClaim } from '../types/auth';

/**
 * authenticate middleware
 * - Verifies a Bearer token provided via the Authorization header
 * - Ensures token contains required claims and attaches `req.user`
 * - Throws `AuthenticationError` on invalid/missing tokens
 */
export default function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization || req.headers.Authorization as string | undefined;
    if (!authHeader) {
        throw new AuthenticationError('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        throw new AuthenticationError('Invalid Authorization header format. Expected: Bearer <token>');
    }

    const token = parts[1];
    let payload: UserClaim;
    try {
        payload = verifyToken(token);
    } catch (err) {
        // Wrap and rethrow as AuthenticationError so the centralized error handler can map status codes.
        throw new AuthenticationError((err as Error).message || 'Invalid token');
    }

    // Attach user claims to request for downstream use..
    req.user = payload;
    next();
}
