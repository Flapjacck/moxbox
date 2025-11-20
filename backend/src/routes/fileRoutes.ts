import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

/**
 * @route   POST /api/files/upload
 * @desc    Upload a new file
 * @access  Private (authenticated users)
 * @todo    Integrate multer for multipart uploads and validate file size/type
 * @todo    Decide if file metadata is stored in DB or file system; persist metadata accordingly
 */
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Use multer as middleware to parse file upload
    // TODO: Validate content-type / file size / filename
    // TODO: Save the file to storage and return created metadata
    res.status(501).json({ message: 'Not Implemented: upload' });
});

/**
 * @route   GET /api/files
 * @desc    List files (with optional pagination)
 * @access  Private (Authenticated users may list files)
 * @todo    Implement listing; return basic metadata (name, size, createdAt, owner)
 * @todo    Optionally add query parameters for pagination and filters
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement retrieval of file list and optional pagination
    res.status(501).json({ message: 'Not Implemented: list files' });
});

/**
 * @route   GET /api/files/:name
 * @desc    Download a file by name
 * @access  Private (Authenticated users)
 * @permissions Ensure only permitted users can download a file (RBAC / owner check)
 * @todo    Implement file stream/download, handle 404s, and authorization
 */
router.get('/:name', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Lookup the file by `req.params.name`, check permissions, then stream/download
    res.status(501).json({ message: 'Not Implemented: download' });
});

/**
 * @route   DELETE /api/files/:name
 * @desc    Delete a file by name
 * @access  Private (Role-based access or owner-only)
 * @permissions Only Admins or file owners should be able to delete files
 * @todo    Implement authorization checks for deletion (RBAC), then removal from storage
 */
router.delete('/:name', (req: Request, res: Response, next: NextFunction) => {
    // TODO: Enforce RBAC (e.g., authorize('admin') or owner check) before deleting
    res.status(501).json({ message: 'Not Implemented: delete' });
});

/**
 * RBAC notes for file routes:
 * - Implement a `authenticate` middleware to populate `req.user`.
 * - Implement an `authorize(...allowedRoles)` middleware that checks if `req.user.role` is permitted.
 * - For owner-specific checks, compare `req.user.id` to file owner metadata.
 */

export default router;
