import express, { Request, Response, NextFunction } from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import { loginUser, getCurrentUser, logoutUser } from '../controllers';

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
 * @desc    Stateless logout route. Instructs the client to delete any stored
 *          access token (client-side) and attempts to clear a cookie named
 *          `token` if present
 * @access  Private
 * @todo    Implement token revocation or other server-side logout flow if
 *          immediate invalidation is required.
 */
router.post('/logout', authenticate, asyncHandler(logoutUser));

/**
 * RBAC (Role-based access control) notes for user routes
 * @todo Implement a middleware (e.g., `authorize(role)`) that checks `req.user.role`
 * @todo For single-user mode, consider setting a role via env var (e.g., ADMIN_ROLE)
 */

export default router;
