/**
 * useUploadWithProgress Hook
 * ===========================
 * Handles file uploads with progress tracking and cancellation.
 * Provides XHR-based uploads that report progress and can be cancelled.
 */

import { useState, useCallback, useRef } from 'react';
import {
    uploadFileWithProgress,
    uploadFilesWithProgress,
} from '../services/uploadWithProgress';
import { isApiError, getErrorMessage } from '../../../utils';
import type { BatchUploadResponse, UploadProgress, BatchConflictInfo } from '../types/file.types';

// ============================================
// Types
// ============================================

/** Initial upload progress state */
const initialProgress: UploadProgress = {
    isUploading: false,
    percent: 0,
    fileCount: 0,
    totalBytes: 0,
};

/** Pending batch upload awaiting conflict resolution */
export interface PendingBatchUpload {
    files: File[];
    conflicts: BatchConflictInfo[];
    totalFiles: number;
}

/** Hook return type */
export interface UseUploadWithProgressReturn {
    uploadProgress: UploadProgress;
    pendingBatchUpload: PendingBatchUpload | null;
    upload: (file: File, folder: string, action?: 'replace' | 'keep_both') => Promise<void>;
    uploadMultiple: (files: File[], folder: string, action?: 'replace' | 'keep_both') => Promise<BatchUploadResponse | null>;
    resolveBatchConflict: (folder: string, action: 'replace' | 'keep_both') => Promise<BatchUploadResponse | null>;
    cancelUpload: () => void;
    cancelBatchUpload: () => void;
}

// ============================================
// Hook
// ============================================

/**
 * Hook for uploading files with progress tracking.
 *
 * @param onSuccess - Callback when upload succeeds (for refreshing file list)
 * @param onError - Callback when upload fails
 */
export function useUploadWithProgress(
    onSuccess: () => Promise<void>,
    onError: (msg: string) => void
): UseUploadWithProgressReturn {
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>(initialProgress);
    const [pendingBatchUpload, setPendingBatchUpload] = useState<PendingBatchUpload | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /** Cancel any in-progress upload */
    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setUploadProgress(initialProgress);
    }, []);

    /** Cancel batch upload (also cancels in-progress upload) */
    const cancelBatchUpload = useCallback(() => {
        cancelUpload();
        setPendingBatchUpload(null);
    }, [cancelUpload]);

    /** Upload a single file with progress */
    const upload = useCallback(async (
        file: File,
        folder: string,
        action?: 'replace' | 'keep_both'
    ) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setUploadProgress({
            isUploading: true,
            percent: 0,
            fileCount: 1,
            totalBytes: file.size,
        });

        try {
            const result = await uploadFileWithProgress(file, folder || undefined, action, {
                onProgress: (percent) => setUploadProgress((p) => ({ ...p, percent })),
                signal: controller.signal,
            });

            if (!result.ok && result.error === 'Upload cancelled') return;

            if (result.status === 409) {
                const err = new Error(result.error || 'Conflict');
                (err as any).status = 409;
                (err as any).payload = result.data;
                throw err;
            }

            if (!result.ok) throw new Error(result.error || 'Upload failed');

            await onSuccess();
        } catch (err: unknown) {
            if (isApiError(err) && err.status === 409) throw err;
            onError(getErrorMessage(err, 'Upload failed'));
        } finally {
            abortControllerRef.current = null;
            setUploadProgress(initialProgress);
        }
    }, [onSuccess, onError]);

    /** Upload multiple files with progress */
    const uploadMultiple = useCallback(async (
        files: File[],
        folder: string,
        action?: 'replace' | 'keep_both'
    ): Promise<BatchUploadResponse | null> => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
        setUploadProgress({
            isUploading: true,
            percent: 0,
            fileCount: files.length,
            totalBytes,
        });

        try {
            const result = await uploadFilesWithProgress(files, folder || undefined, action, {
                onProgress: (percent) => setUploadProgress((p) => ({ ...p, percent })),
                signal: controller.signal,
            });

            if (!result.ok && result.error === 'Upload cancelled') return null;

            // Handle 409 conflicts
            if (result.status === 409 && result.data) {
                const payload = result.data as unknown as Record<string, unknown>;
                if (payload.conflicts) {
                    setPendingBatchUpload({
                        files,
                        conflicts: payload.conflicts as BatchConflictInfo[],
                        totalFiles: (payload.totalFiles as number) || files.length,
                    });
                    return null;
                }
                if (payload.trashedConflicts) {
                    onError(`Files exist in Trash: ${(payload.trashedConflicts as string[]).join(', ')}`);
                    return null;
                }
            }

            if (!result.ok) {
                onError(result.error || 'Upload failed');
                return null;
            }

            setPendingBatchUpload(null);
            await onSuccess();
            return result.data;
        } catch (err) {
            onError(getErrorMessage(err, 'Batch upload failed'));
            return null;
        } finally {
            abortControllerRef.current = null;
            setUploadProgress(initialProgress);
        }
    }, [onSuccess, onError]);

    /** Resolve batch conflict with action */
    const resolveBatchConflict = useCallback(async (
        folder: string,
        action: 'replace' | 'keep_both'
    ): Promise<BatchUploadResponse | null> => {
        if (!pendingBatchUpload) return null;

        const result = await uploadMultiple(pendingBatchUpload.files, folder, action);
        setPendingBatchUpload(null);
        return result;
    }, [pendingBatchUpload, uploadMultiple]);

    return {
        uploadProgress,
        pendingBatchUpload,
        upload,
        uploadMultiple,
        resolveBatchConflict,
        cancelUpload,
        cancelBatchUpload,
    };
}
