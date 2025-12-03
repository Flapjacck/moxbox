/**
 * useFolders Hook
 * ================
 * State management for folder operations.
 * Handles navigation, creation, renaming, and deletion of folders.
 */

import { useState, useCallback } from 'react';
import {
    listFolderContents,
    createFolder,
    renameFolder,
    deleteFolder,
} from '../services/folderService';
import { buildBreadcrumbs, getParentPath } from '../../../utils/breadcrumbs';
import { getErrorMessage } from '../../../utils/apiHelpers';
import type { DirectoryEntry, BreadcrumbSegment } from '../types/folder.types';

/** State shape returned by the hook */
export interface UseFoldersState {
    /** Current folder path */
    currentPath: string;
    /** Contents of current folder */
    contents: DirectoryEntry[];
    /** Breadcrumb segments for navigation */
    breadcrumbs: BreadcrumbSegment[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
}

/** Actions returned by the hook */
export interface UseFoldersActions {
    /** Navigate to a folder path */
    navigateTo: (path: string) => Promise<void>;
    /** Navigate up one level */
    navigateUp: () => Promise<void>;
    /** Refresh current folder */
    refresh: () => Promise<void>;
    /** Create a new folder by full path */
    create: (fullPath: string) => Promise<void>;
    /** Rename a folder */
    rename: (oldPath: string, newName: string) => Promise<void>;
    /** Delete an empty folder */
    remove: (path: string) => Promise<void>;
    /** Clear error */
    clearError: () => void;
}


/**
 * Hook for managing folder navigation and operations.
 */
export const useFolders = (): UseFoldersState & UseFoldersActions => {
    const [currentPath, setCurrentPath] = useState('');
    const [contents, setContents] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Build breadcrumbs from current path
    const breadcrumbs = buildBreadcrumbs(currentPath);

    // Navigate to a specific folder path
    const navigateTo = useCallback(async (path: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await listFolderContents(path);
            setCurrentPath(path);
            setContents(response.contents);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load folder'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Navigate up one level
    const navigateUp = useCallback(async () => {
        if (!currentPath) return; // Already at root
        await navigateTo(getParentPath(currentPath));
    }, [currentPath, navigateTo]);

    // Refresh current folder contents
    const refresh = useCallback(async () => {
        await navigateTo(currentPath);
    }, [currentPath, navigateTo]);

    // Create a new folder by full path
    const create = useCallback(async (fullPath: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await createFolder(fullPath);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create folder'));
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    // Rename a folder
    const rename = useCallback(async (oldPath: string, newName: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const parentPath = getParentPath(oldPath);
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;
            await renameFolder(oldPath, newPath);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to rename folder'));
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    // Delete an empty folder
    const remove = useCallback(async (path: string) => {
        setError(null);
        setIsLoading(true);
        try {
            await deleteFolder(path);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to delete folder'));
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    return {
        currentPath,
        contents,
        breadcrumbs,
        isLoading,
        error,
        navigateTo,
        navigateUp,
        refresh,
        create,
        rename,
        remove,
        clearError,
    };
};
