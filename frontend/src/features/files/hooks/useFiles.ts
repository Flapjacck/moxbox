/**
 * useFiles Hook
 * ==============
 * State management for active file operations.
 * Handles fetching, uploading, downloading, and soft-deleting files.
 * Works with FileItem objects from the new ID-based API.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    listFiles,
    uploadFile,
    downloadFileById,
    softDeleteFile,
} from '../services/fileService';
import type { FileItem } from '../types/file.types';

/** State shape returned by the hook */
export interface UseFilesState {
    files: FileItem[];
    isLoading: boolean;
    error: string | null;
}

/** Actions returned by the hook */
export interface UseFilesActions {
    fetchFiles: () => Promise<void>;
    upload: (file: File, folder?: string) => Promise<void>;
    download: (file: FileItem) => Promise<void>;
    remove: (file: FileItem) => Promise<void>;
    clearError: () => void;
}

/**
 * Hook for managing active file list state and operations.
 * Automatically fetches files on mount.
 */
export const useFiles = (): UseFilesState & UseFilesActions => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch active files from server
    const fetchFiles = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await listFiles('active');
            setFiles(response.files);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load files';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Upload a file then refresh list
    const upload = useCallback(async (file: File, folder?: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await uploadFile(file, folder);
            await fetchFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [fetchFiles]);

    // Download file and trigger browser download
    const download = useCallback(async (file: FileItem) => {
        setError(null);
        try {
            const blob = await downloadFileById(file.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName; // Use original filename
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Download failed';
            setError(msg);
        }
    }, []);

    // Soft-delete file (move to trash) then refresh list
    const remove = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await softDeleteFile(file.id);
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