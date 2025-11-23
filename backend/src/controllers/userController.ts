import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import config from '../config/env';
import { signToken } from '../utils/token';
import type { UserClaim } from '../types/auth';
import { AuthenticationError, ValidationError } from '../middleware/errors';

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
    return res.status(200).json({ user });
}

