/**
 * useTrash Hook
 * ==============
 * State management for trash (soft-deleted) file operations.
 * Handles fetching deleted files, restoring, and permanent deletion.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    listFiles,
    restoreFile,
    permanentDeleteFile,
} from '../services/fileService';
import type { FileItem } from '../types/file.types';

/** State shape returned by the hook */
export interface UseTrashState {
    trashedFiles: FileItem[];
    isLoading: boolean;
    error: string | null;
}

/** Actions returned by the hook */
export interface UseTrashActions {
    fetchTrashedFiles: () => Promise<void>;
    restore: (file: FileItem) => Promise<void>;
    permanentDelete: (file: FileItem) => Promise<void>;
    emptyTrash: () => Promise<void>;
    clearError: () => void;
}

/**
 * Hook for managing trashed (soft-deleted) files.
 * Automatically fetches trashed files on mount.
 */
export const useTrash = (): UseTrashState & UseTrashActions => {
    const [trashedFiles, setTrashedFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch soft-deleted files from server
    const fetchTrashedFiles = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await listFiles('deleted');
            setTrashedFiles(response.files);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load trash';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Restore a file from trash
    const restore = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await restoreFile(file.id);
            await fetchTrashedFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Restore failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTrashedFiles]);

    // Permanently delete a file (cannot be undone)
    const permanentDelete = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await permanentDeleteFile(file.id);
            await fetchTrashedFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTrashedFiles]);

    // Empty entire trash (permanently delete all trashed files)
    const emptyTrash = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            // Delete all trashed files one by one
            for (const file of trashedFiles) {
                await permanentDeleteFile(file.id);
            }
            await fetchTrashedFiles();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to empty trash';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [trashedFiles, fetchTrashedFiles]);

    // Clear error message
    const clearError = useCallback(() => setError(null), []);

    // Fetch trashed files on mount
    useEffect(() => {
        fetchTrashedFiles();
    }, [fetchTrashedFiles]);

    return {
        trashedFiles,
        isLoading,
        error,
        fetchTrashedFiles,
        restore,
        permanentDelete,
        emptyTrash,
        clearError,
    };
};
