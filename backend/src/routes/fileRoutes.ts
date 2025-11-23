import express from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import upload from '../middleware/multerHandler';
import { uploadFile, listFiles, downloadFile, deleteFile } from '../controllers/fileController';

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
 * @route   GET /api/files/:name
 * @desc    Download/stream a file by name
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only owner or admin can download)
 * @todo    Add support for range requests (partial content)
 */
router.get('/:name', authenticate, asyncHandler(downloadFile));

/**
 * @route   DELETE /api/files/:name
 * @desc    Delete a file by name
 * @access  Private (authenticated users)
 * @todo    Add authorization check (only admin or file owner can delete)
 */
router.delete('/:name', authenticate, asyncHandler(deleteFile));

/**
 * RBAC notes for file routes:
 * - `authenticate` middleware populates `req.user` with verified JWT claims
 * @todo Implement `authorize(...allowedRoles)` middleware for role-based checks
 * @todo Add owner-specific checks (compare `req.user.id` to file owner metadata)
 */

export default router;
