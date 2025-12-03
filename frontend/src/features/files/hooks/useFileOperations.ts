/**
 * useFileOperations Hook
 * =======================
 * Centralized file operations (upload, download, delete).
 * Used by useFileBrowser and useFiles to avoid duplication.
 * Handles conflict detection and error management.
 */

import { useCallback } from 'react';
import {
    uploadFile,
    uploadFiles as uploadFilesService,
    downloadFileById,
    softDeleteFile,
} from '../services/fileService';
import { downloadBlob, isApiError } from '../../../utils';
import type { FileItem, BatchUploadResponse, BatchConflictInfo } from '../types/file.types';

// ============================================
// Types
// ============================================

/** Pending batch upload awaiting conflict resolution */
export interface PendingBatchUpload {
    files: File[];
    conflicts: BatchConflictInfo[];
    totalFiles: number;
}

/** Result from uploadMultiple when conflicts are detected */
export interface BatchUploadResult {
    /** Upload response if successful */
    response: BatchUploadResponse | null;
    /** Pending upload info if conflicts detected */
    pendingUpload: PendingBatchUpload | null;
    /** Error message if failed */
    error: string | null;
}

/** Callbacks for operation lifecycle events */
export interface FileOperationCallbacks {
    /** Called when an operation starts */
    onStart?: () => void;
    /** Called when an operation completes (success or failure) */
    onComplete?: () => void;
    /** Called on error with the error message */
    onError?: (message: string) => void;
}

// ============================================
// Hook
// ============================================

/**
 * Provides file operation functions with consistent error handling.
 * Does NOT manage its own state - caller provides callbacks for state updates.
 *
 * @param currentPath - Current folder path for uploads
 * @returns Object with upload, download, and delete operations
 */
export const useFileOperations = (currentPath: string = '') => {
    /**
     * Upload a single file to the current folder.
     * @param file - File to upload
     * @param action - Optional conflict resolution action
     * @throws ApiError with status 409 if duplicate detected (caller should handle)
     */
    const upload = useCallback(
        async (file: File, action?: 'replace' | 'keep_both'): Promise<void> => {
            await uploadFile(file, currentPath || undefined, action);
        },
        [currentPath]
    );

    /**
     * Upload multiple files (batch/folder upload).
     * Returns conflict info if duplicates detected instead of throwing.
     *
     * @param files - Array of files to upload
     * @param action - Optional conflict resolution action
     * @returns BatchUploadResult with response, pending conflicts, or error
     */
    const uploadMultiple = useCallback(
        async (
            files: File[],
            action?: 'replace' | 'keep_both'
        ): Promise<BatchUploadResult> => {
            try {
                const response = await uploadFilesService(files, currentPath || undefined, action);
                return { response, pendingUpload: null, error: null };
            } catch (err: unknown) {
                // Check for 409 conflict with conflict payload
                if (isApiError(err) && err.status === 409 && err.payload) {
                    const payload = err.payload as {
                        conflicts?: BatchConflictInfo[];
                        totalFiles?: number;
                        trashedConflicts?: string[];
                    };

                    // Handle active file conflicts
                    if (payload.conflicts) {
                        return {
                            response: null,
                            pendingUpload: {
                                files,
                                conflicts: payload.conflicts,
                                totalFiles: payload.totalFiles || files.length,
                            },
                            error: null,
                        };
                    }

                    // Handle trashed file conflicts
                    if (payload.trashedConflicts) {
                        return {
                            response: null,
                            pendingUpload: null,
                            error: `Some files exist in Trash: ${payload.trashedConflicts.join(', ')}. Remove them from Trash first.`,
                        };
                    }
                }

                // Generic error
                const message = err instanceof Error ? err.message : 'Batch upload failed';
                return { response: null, pendingUpload: null, error: message };
            }
        },
        [currentPath]
    );

    /**
     * Download a file by triggering browser download.
     * @param file - FileItem to download
     */
    const download = useCallback(async (file: FileItem): Promise<void> => {
        const blob = await downloadFileById(file.id);
        downloadBlob(blob, file.originalName);
    }, []);

    /**
     * Soft-delete a file (move to trash).
     * @param file - FileItem to delete
     */
    const remove = useCallback(async (file: FileItem): Promise<void> => {
        await softDeleteFile(file.id);
    }, []);

    return {
        upload,
        uploadMultiple,
        download,
        remove,
    };
};
