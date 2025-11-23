import express, { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import { loginUser, getCurrentUser } from '../controllers';

const router = express.Router();

/**
 * @route   POST /api/users/login
 * @desc    Authenticate single user from env vars (single-user auth for now)
 * @access  Public
 * @todo    Implement single-user authentication using env variables (e.g. ADMIN_USERNAME, ADMIN_PASSWORD)
 * @todo    Replace with DB-based user management later
 */
router.post('/login', asyncHandler(loginUser));

/**
 * @route   GET /api/users/me
 * @desc    Return authenticated user
 * @access  Private
 * @todo    Implement authentication middleware that decodes/validates JWT
 * @todo    For now, read user info from env vars and return
 */
router.get('/me', authenticate, asyncHandler(getCurrentUser));

/**
 * @route   POST /api/users/logout
 * @desc    Logout route (client-only invalidation for JWT by default)
 * @access  Private
 * @todo    Provide soft logout flow (e.g. token blacklist or client token deletion)
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Optionally implement token revocation if you support blacklists
    res.status(501).json({ message: 'Not Implemented: logout' });
});

/**
 * RBAC (Role-based access control) notes for user routes
 * @todo Implement a middleware (e.g., `authorize(role)`) that checks `req.user.role`
 * @todo For single-user mode, consider setting a role via env var (e.g., ADMIN_ROLE)
 */

export default router;
