/**
 * useFiles Hook
 * ==============
 * State management for active file operations.
 * Handles fetching, uploading, downloading, and soft-deleting files.
 * Works with FileItem objects from the ID-based API.
 */

import { useState, useCallback, useEffect } from 'react';
import { listFiles } from '../services/fileService';
import { useFileOperations } from './useFileOperations';
import { getErrorMessage } from '../../../utils';
import type { FileItem } from '../types/file.types';

// ============================================
// Types
// ============================================

/** State shape returned by the hook */
export interface UseFilesState {
    files: FileItem[];
    isLoading: boolean;
    error: string | null;
}

/** Actions returned by the hook */
export interface UseFilesActions {
    fetchFiles: () => Promise<void>;
    upload: (file: File, folder?: string, action?: 'replace' | 'keep_both') => Promise<void>;
    download: (file: FileItem) => Promise<void>;
    remove: (file: FileItem) => Promise<void>;
    clearError: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for managing active file list state and operations.
 * Automatically fetches files on mount.
 *
 * @param folder - Optional folder path for uploads (default: root)
 */
export const useFiles = (folder = ''): UseFilesState & UseFilesActions => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File operations from shared hook
    const fileOps = useFileOperations(folder);

    /** Fetch active files from server */
    const fetchFiles = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await listFiles('active');
            setFiles(response.files);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load files'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    /** Upload a file then refresh list */
    const upload = useCallback(async (
        file: File,
        uploadFolder?: string,
        action?: 'replace' | 'keep_both'
    ) => {
        setError(null);
        setIsLoading(true);
        try {
            // Use provided folder or default from hook
            const ops = uploadFolder !== undefined
                ? {
                    ...fileOps, upload: async (f: File, a?: 'replace' | 'keep_both') => {
                        const { uploadFile } = await import('../services/fileService');
                        await uploadFile(f, uploadFolder, a);
                    }
                }
                : fileOps;
            await ops.upload(file, action);
            await fetchFiles();
        } catch (err) {
            setError(getErrorMessage(err, 'Upload failed'));
        } finally {
            setIsLoading(false);
        }
    }, [fileOps, fetchFiles]);

    /** Download file and trigger browser download */
    const download = useCallback(async (file: FileItem) => {
        setError(null);
        try {
            await fileOps.download(file);
        } catch (err) {
            setError(getErrorMessage(err, 'Download failed'));
        }
    }, [fileOps]);

    /** Soft-delete file (move to trash) then refresh list */
    const remove = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await fileOps.remove(file);
            await fetchFiles();
        } catch (err) {
            setError(getErrorMessage(err, 'Delete failed'));
        } finally {
            setIsLoading(false);
        }
    }, [fileOps, fetchFiles]);

    /** Clear error message */
    const clearError = useCallback(() => setError(null), []);

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return { files, isLoading, error, fetchFiles, upload, download, remove, clearError };
};
