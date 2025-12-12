import express from 'express';
import asyncHandler from '../middleware/asyncHandler';
import authenticate from '../middleware/authenticate';
import {
    createFolder,
    renameFolder,
    deleteFolder,
    getRootFolderInfo,
    listFolderContents,
} from '../controllers/folderController';

const router = express.Router();

/**
 * Folder Routes
 * - Manage directories within FILES_DIR
 * - All paths are relative to FILES_DIR root
 */

/**
 * @route   GET /api/folders/root
 * @desc    Get root folder size info (space used at root level)
 * @access  Private (authenticated users)
 */
router.get('/root', authenticate, asyncHandler(getRootFolderInfo));

/**
 * @route   POST /api/folders
 * @desc    Create a new folder
 * @access  Private (authenticated users)
 * @body    { path: "relative/folder/path" }
 */
router.post('/', authenticate, asyncHandler(createFolder));

/**
 * @route   PATCH /api/folders/rename
 * @desc    Rename (move) a folder
 * @access  Private (authenticated users)
 * @body    { oldPath: "old/path", newPath: "new/path" }
 */
router.patch('/rename', authenticate, asyncHandler(renameFolder));

/**
 * @route   DELETE /api/folders
 * @desc    Delete an empty folder
 * @access  Private (authenticated users)
 * @body    { path: "relative/folder/path" }
 */
router.delete('/', authenticate, asyncHandler(deleteFolder));

/**
 * @route   GET /api/folders/list
 * @desc    List files and subfolders in a directory
 * @access  Private (authenticated users)
 * @query   ?path=relative/folder/path (optional, defaults to root)
 */
router.get('/list', authenticate, asyncHandler(listFolderContents));

export default router;
