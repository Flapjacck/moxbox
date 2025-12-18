import express from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import upload from '../middleware/multerHandler';
import { uploadTracker } from '../middleware/uploadTracker';
import {
    uploadFile,
    uploadFiles,
    listFiles,
    downloadFileById,
    updateFileMetadata,
    softDeleteFile,
    restoreFile,
    permanentDeleteById,
} from '../controllers/files';

const router = express.Router();

/**
 * File Routes
 * - Manage files within FILES_DIR (supports subdirectories)
 * - Upload accepts optional `folder` field for subdirectory placement
 * - File paths stored as relative paths in DB (e.g., "folder/file.txt")
 */

/**
 * @route   POST /api/files/upload
 * @desc    Upload a new file to storage (optionally into a subdirectory)
 * @access  Private (authenticated users)
 * @middleware multer - Handles multipart/form-data, validates file size/type
 * @middleware uploadTracker - Cleans up files if request is aborted
 * @body    file - The file to upload (multipart)
 * @body    folder - Optional subdirectory path (e.g., "projects/2024")
 * @body    action - Optional upload action when a duplicate exists: 'replace'|'keep_both'
 */
router.post('/upload', authenticate, uploadTracker, upload.single('file'), asyncHandler(uploadFile));

/**
 * @route   POST /api/files/upload/batch
 * @desc    Upload multiple files at once, preserving folder structure
 * @access  Private (authenticated users)
 * @middleware multer.array - Handles multiple files in multipart/form-data
 * @middleware uploadTracker - Cleans up files if request is aborted
 * @body    file[] - Array of files to upload
 * @body    relativePath[] - Array of relative paths (from webkitRelativePath) matching file order
 * @body    folder - Optional base folder to upload into
 * @returns { message, totalCount, successCount, failureCount, results[] }
 */
router.post('/upload/batch', authenticate, uploadTracker, upload.array('file'), asyncHandler(uploadFiles));

/**
 * @route   GET /api/files
 * @desc    List file metadata from DB (owned by user)
 * @access  Private (authenticated users)
 * @query   ?ownerId=xyz - Filter by owner (defaults to current user)
 * @query   ?isPublic=true - Filter by public visibility
 * @query   ?limit=10&offset=0 - Pagination
 */
router.get('/', authenticate, asyncHandler(listFiles));

/**
 * @route   GET /api/files/id/:id
 * @desc    Download/stream a file by DB id (UUID)
 * @access  Private (authenticated users)
 * @note    Files may be in subdirectories; path resolved from DB storage_path
 */
router.get('/id/:id', authenticate, asyncHandler(downloadFileById));

/**
 * @route   PATCH /api/files/id/:id
 * @desc    Update file metadata (original_name, is_public, metadata_json)
 * @access  Private (authenticated users)
 */
router.patch('/id/:id', authenticate, asyncHandler(updateFileMetadata));

/**
 * @route   POST /api/files/id/:id/soft-delete
 * @desc    Soft-delete a file (mark DB record status = 'deleted')
 * @access  Private (authenticated users)
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
 * @desc    Permanently delete file from DB and storage (supports subdirectories)
 * @access  Private (authenticated users)
 */
router.delete('/id/:id/permanent', authenticate, asyncHandler(permanentDeleteById));

export default router;
