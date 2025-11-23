import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import config from '../config/env';
import { signToken } from '../utils/token';
import type { UserClaim } from '../types/auth';
import { AuthenticationError, ValidationError } from '../middleware/errors';
import { info } from '../utils/logger';

// Controller: User
// -----------------
// This file contains controller logic related to user management and
// authentication.

/**
 * POST /api/users/login
 * Performs payload validation, verifies the configured
 * username and password hash, then issues a signed JWT.
 *
 * NOTE: This is intentionally implementation-specific for a minimal
 * single-user setup.
 */
export async function loginUser(req: Request, res: Response) {
    // Validate request payload using `zod`.
    const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        // Provide structured validation information when available. Use z.treeifyError
        const formattedError = z.treeifyError(parsed.error);
        throw new ValidationError('Invalid login payload', formattedError);
    }

    const { username, password } = parsed.data;

    // Check username
    if (username !== config.adminUser) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Ensure an admin password hash is configured.
    if (!config.adminPasswordHash) {
        // Failing closed rather than comparing to an empty string.
        throw new AuthenticationError('Invalid credentials');
    }

    // Compare plain password to configured ADMIN_PASSWORD_HASH
    const isMatch = await bcrypt.compare(password, config.adminPasswordHash);
    if (!isMatch) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Build the user claim and issue a token
    const userClaim: UserClaim = {
        id: config.adminUser,
        username: config.adminUser,
        role: 'admin',
    };

    const token = signToken(userClaim);

    // Return token and minimal user info (do not return password/hash)
    res.status(200).json({ token, user: { id: userClaim.id, username: userClaim.username, role: userClaim.role } });
    // Inform the server log that a login occurred (without revealing credentials)
    try { info('User logged in', { username: userClaim.username }); } catch { /* no-op */ }
}

/**
 * GET /api/users/me
 * Return information about the currently authenticated user.
 * For the single-user mode this returns a simplified user object derived
 * from either the verified token (attached by middleware) or the configured
 * environment variables (fallback).
 */
export async function getCurrentUser(req: Request, res: Response) {
    // The `authenticate` middleware attaches a `user` claim to the request.
    // Use a typed cast; fallback to configured admin user when claims are absent.
    const maybeUser = (req as any).user as UserClaim | undefined;

    if (!maybeUser) {
        // If there's no user attached, provide a minimal fallback from env config.
        const fallback = { id: config.adminUser, username: config.adminUser, role: 'admin' };
        return res.status(200).json({ user: fallback });
    }

    // Return a simplified user object (avoid leaking sensitive info)
    const user = { id: maybeUser.id, username: maybeUser.username, role: maybeUser.role };
    info('Return current user', { username: user.username });
    return res.status(200).json({ user });
}

/**
 * POST /api/users/logout
 * Stateless logout endpoint.
 *
 * This route performs a client-directed logout for stateless JWT-based
 * authentication: the server doesn't track issued tokens and therefore
 * cannot revoke them. Instead, it instructs clients to remove their
 * locally stored access tokens.
 *
 * Access: Protected (requires `authenticate` middleware that verifies the
 *         token before reaching this controller).  This means the JWT used
 *         to call this route must be valid at the time of logout.
 *
 * Response: 204 No Content on success.
 */
export async function logoutUser(_req: Request, res: Response) {

    // Attempt to clear a cookie called 'token' if one was used in the app.
    // This is safe to call even if cookies are not used — Express will
    // simply set a header that expires a non-existent cookie.
    try {
        res.clearCookie('token');
    } catch (err) {
        // Noop: clearing a cookie is a best-effort operation. If cookies are
        // not configured, this does not constitute an error for logout.
    }

    // Instruct clients to remove their locally stored token(s). Return
    // 204 No Content to indicate the user is logged out and there's no
    // additional payload needed.
    try { info('User logged out'); } catch { }
    return res.status(204).send();
}

