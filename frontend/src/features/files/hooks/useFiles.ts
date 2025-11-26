/**
 * useFiles Hook
 * ==============
 * State management for file operations.
 * Handles fetching, uploading, downloading, and deleting files.
 */

import { useState, useCallback, useEffect } from 'react';
import { listFiles, uploadFile, downloadFile, deleteFile } from '../services/fileService';

/** State shape returned by the hook */
export interface UseFilesState {
    files: string[];
    isLoading: boolean;
    error: string | null;
}

/** Actions returned by the hook */
export interface UseFilesActions {
    fetchFiles: (pattern?: string) => Promise<void>;
    upload: (file: File) => Promise<void>;
    download: (filename: string) => Promise<void>;
    remove: (filename: string) => Promise<void>;
    clearError: () => void;
}

/**
 * Hook for managing file list state and operations.
 * Automatically fetches files on mount.
 */
export const useFiles = (): UseFilesState & UseFilesActions => {
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch files from server
    const fetchFiles = useCallback(async (pattern?: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await listFiles(pattern);
            setFiles(response.files);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load files';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Upload a file then refresh list
    const upload = useCallback(async (file: File) => {
        setError(null);
        setIsLoading(true);
        try {
            await uploadFile(file);
            await fetchFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFiles]);

    // Download file and trigger browser download
    const download = useCallback(async (filename: string) => {
        setError(null);
        try {
            const blob = await downloadFile(filename);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Download failed';
            setError(msg);
        }
    }, []);

    // Delete file then refresh list
    const remove = useCallback(async (filename: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await deleteFile(filename);
            await fetchFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFiles]);

    // Clear error message
    const clearError = useCallback(() => setError(null), []);

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return { files, isLoading, error, fetchFiles, upload, download, remove, clearError };
};