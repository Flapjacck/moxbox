import { Request, Response } from 'express';
import { z } from 'zod';
import { signToken } from '../utils/token';
import { hashPassword, verifyPassword } from '../utils/passwordHash';
import { getUserByUsername } from '../models/users';
import type { UserClaim } from '../types/auth';
import { AuthenticationError, ValidationError } from '../middleware/errors';
import { info } from '../utils/logger';

// Controller: User
// -----------------
// User authentication and session management.
// Users are stored in the database; authentication uses JWT tokens.

/**
 * POST /api/users/login
 * Authenticate user against database and issue JWT token.
 */
export async function loginUser(req: Request, res: Response) {
    const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        const formattedError = z.treeifyError(parsed.error);
        throw new ValidationError('Invalid login payload', formattedError);
    }

    const { username, password } = parsed.data;

    // Look up user in database
    const user = getUserByUsername(username);
    if (!user) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
        throw new AuthenticationError('Invalid credentials');
    }

    // Build token and return
    const userClaim: UserClaim = {
        id: user.id,
        username: user.username,
        role: user.is_admin ? 'admin' : 'user',
        // Include a version derived from the user's timestamps so tokens
        // become invalid when the user's record changes (password reset, etc.)
        v: user.updated_at ?? user.created_at,
    };

    const token = signToken(userClaim);
    res.status(200).json({ token, user: { id: userClaim.id, username: userClaim.username, role: userClaim.role } });
    try { info('User logged in', { username: user.username }); } catch { /* no-op */ }
}

/**
 * GET /api/users/me
 * Return the authenticated user's profile.
 * User data comes from JWT token attached by authenticate middleware.
 */
export async function getCurrentUser(req: Request, res: Response) {
    const maybeUser = (req as any).user as UserClaim | undefined;

    if (!maybeUser) {
        throw new AuthenticationError('User not found in token');
    }

    const user = { id: maybeUser.id, username: maybeUser.username, role: maybeUser.role };
    info('Return current user', { username: user.username });
    return res.status(200).json({ user });
}

/**
 * POST /api/users/logout
 * Stateless logout. Client removes stored token.
 */
export async function logoutUser(_req: Request, res: Response) {
    try {
        res.clearCookie('token');
    } catch (err) {
        // Noop: best-effort
    }

    try { info('User logged out'); } catch { }
    return res.status(204).send();
}


