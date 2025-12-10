import express, { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import { z } from 'zod';
import { getUserById, updatePassword } from '../models/users';
import { hashPassword, verifyPassword } from '../utils/passwordHash';
import { ValidationError, AuthenticationError } from '../middleware/errors';
import type { UserClaim } from '../types/auth';

const router = express.Router();

/**
 * GET /api/account
 * Return authenticated user's account info.
 * Access: Private (requires authentication)
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as UserClaim;
    const userRecord = getUserById(user.id);

    if (!userRecord) {
        throw new AuthenticationError('User not found');
    }

    res.status(200).json({
        id: userRecord.id,
        username: userRecord.username,
        isAdmin: userRecord.is_admin === 1,
        createdAt: userRecord.created_at,
    });
}));

/**
 * PATCH /api/account
 * Change the authenticated user's password.
 * Body: { currentPassword: string, newPassword: string }
 * Access: Private (requires authentication)
 */
router.patch('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as UserClaim;
    const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        const formattedError = z.treeifyError(parsed.error);
        throw new ValidationError('Invalid password update payload', formattedError);
    }

    const { currentPassword, newPassword } = parsed.data;
    const userRecord = getUserById(user.id);

    if (!userRecord) {
        throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, userRecord.password_hash);
    if (!isMatch) {
        throw new AuthenticationError('Current password is incorrect');
    }

    // Hash and update new password
    const newHash = await hashPassword(newPassword);
    updatePassword(user.id, newHash);

    res.status(200).json({ message: 'Password updated successfully' });
}));

/**
 * DELETE /api/account
 * Delete the authenticated user's account.
 * Currently not implemented; requires careful consideration.
 * Access: Private (requires authentication)
 */
router.delete('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Account deletion not yet implemented' });
}));

export default router;

