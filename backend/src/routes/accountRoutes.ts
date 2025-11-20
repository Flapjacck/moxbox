import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

/**
 * @route   GET /api/account
 * @desc    Return server account info (single-user mode)
 * @access  Private (Admin)
 * @todo    Return admin account metadata (from env in single-user mode)
 * @note    In future, this should return data from DB when multi-user is supported
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Authenticate and authorize (admin-only)
    // TODO: Return admin account metadata (limited info)
    res.status(501).json({ message: 'Not Implemented: account get' });
});

/**
 * @route   PATCH /api/account
 * @desc    Update account (change password, update profile)
 * @access  Private (Admin)
 * @todo    Implement profile updates with validation (e.g. password strength)
 */
router.patch('/', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Auth + validate input
    // TODO: For single-user mode, update env-backed credentials (or document manual steps)
    res.status(501).json({ message: 'Not Implemented: account patch' });
});

/**
 * @route   DELETE /api/account
 * @desc    Delete account (for single-user mode this might be a manual process)
 * @access  Private (Admin)
 * @todo    Implement account delete (if supported); for single-user, consider leaving as a manual step
 */
router.delete('/', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Consider whether to allow this for single-user mode; if enabled, implement delete
    res.status(501).json({ message: 'Not Implemented: account delete' });
});

/**
 * RBAC notes for account routes
 * - Account-related operations are typically admin-only.
 * - Implement `authenticate` + `authorize('admin')` middleware.
 */

export default router;
