import express from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import upload from '../middleware/multerHandler';
import {
    uploadFile,
    listFiles,
    downloadFileById,
} from '../controllers/fileController';
import {
    updateFileMetadata,
    softDeleteFile,
    restoreFile,
    permanentDeleteById,
} from '../controllers/fileAdminController';

const router = express.Router();

/**
 * @route   POST /api/files/upload
 * @desc    Upload a new file
 * @access  Private (authenticated users)
 * @middleware multer - Handles multipart/form-data, validates file size/type
 * @todo    Add file metadata storage (owner, uploadDate, mimetype)
 */
router.post('/upload', authenticate, upload.single('file'), asyncHandler(uploadFile));

/**
 * @route   GET /api/files
 * @desc    List files (with optional pattern filter)
 * @access  Private (authenticated users)
 * @query   ?pattern=xyz - Optional filter to match filenames
 * @todo    Add pagination support (offset, limit)
 * @todo    Add filtering by mimetype, size, date range, owner
 * @todo    Return metadata (size, uploadDate, owner, mimetype)
 */
router.get('/', authenticate, asyncHandler(listFiles));

/**
 * @route   GET /api/files/id/:id
 * @desc    Download/stream a file by DB id (UUID)
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only owner or admin can download)
 * @todo    Add support for range requests (partial content)
 */
router.get('/id/:id', authenticate, asyncHandler(downloadFileById));

/**
 * @route   DELETE /api/files/id/:id/permanent
 * @desc    Permanently delete a file by DB id
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only admin or file owner can delete)
 */
// Permanent delete is handled by the admin controller. See route below.

/**
 * @route   PATCH /api/files/id/:id
 * @desc    Update file metadata (original_name, is_public, metadata_json)
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only admin or file owner can update metadata)
 */
router.patch('/id/:id', authenticate, asyncHandler(updateFileMetadata));

/**
 * @route   POST /api/files/id/:id/soft-delete
 * @desc    Soft-delete a file (mark DB record status = 'deleted')
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only admin or file owner)
 */
router.post('/id/:id/soft-delete', authenticate, asyncHandler(softDeleteFile));

/**
 * @route   POST /api/files/id/:id/restore
 * @desc    Restore a soft-deleted file (set status = 'active')
 * @access  Private (authenticated users)
 */
router.post('/id/:id/restore', authenticate, asyncHandler(restoreFile));

/**
 * @route   DELETE /api/files/id/:id/permanent
 * @desc    Permanently delete a file's DB record and storage object
 * @access  Private (authenticated users)
 */
router.delete('/id/:id/permanent', authenticate, asyncHandler(permanentDeleteById));

/**
 * RBAC notes for file routes:
 * - `authenticate` middleware populates `req.user` with verified JWT claims
 * @todo Implement `authorize(...allowedRoles)` middleware for role-based checks
 * @todo Add owner-specific checks (compare `req.user.id` to file owner metadata)
 */

export default router;
