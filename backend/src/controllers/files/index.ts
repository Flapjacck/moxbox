/**
 * File Controllers - Barrel Export
 * Re-exports all file-related controller functions from modular files.
 */

// Single file upload
export { uploadFile } from './upload';

// Batch/folder upload
export { uploadFiles } from './uploadBatch';

// List and download
export { listFiles, downloadFileById } from './list';

// File management (metadata, delete, restore)
export {
    updateFileMetadata,
    softDeleteFile,
    restoreFile,
    permanentDeleteById,
} from './manage';

// Types
export type { BatchFileResult, ConflictInfo, BatchUploadResponse, ConflictResponse } from './types';
