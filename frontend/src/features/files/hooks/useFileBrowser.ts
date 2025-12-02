/**
 * useFileBrowser Hook
 * ====================
 * Combined hook for file and folder browsing.
 * Manages navigation, file operations, and folder operations in one place.
 */

import { useState, useCallback, useEffect } from 'react';
import { listFolderContents } from '../../folders/services/folderService';
import {
    listFiles,
    uploadFile,
    downloadFileById,
    softDeleteFile,
} from '../services/fileService';
import type { FileItem } from '../types/file.types';
import type { DirectoryEntry, BreadcrumbSegment } from '../../folders/types/folder.types';

/** State shape for file browser */
export interface UseFileBrowserState {
    /** Current folder path */
    currentPath: string;
    /** Files in current folder (from DB with metadata) */
    files: FileItem[];
    /** Subfolders in current folder */
    folders: DirectoryEntry[];
    /** Breadcrumb navigation segments */
    breadcrumbs: BreadcrumbSegment[];
    /** Loading state */
    isLoading: boolean;
    /** Error message */
    error: string | null;
}

/** Actions for file browser */
export interface UseFileBrowserActions {
    /** Navigate to a folder */
    navigateTo: (path: string) => Promise<void>;
    /** Navigate up one level */
    navigateUp: () => Promise<void>;
    /** Refresh current view */
    refresh: () => Promise<void>;
    /** Upload a file to current folder */
    upload: (file: File) => Promise<void>;
    /** Download a file */
    download: (file: FileItem) => Promise<void>;
    /** Soft-delete a file (move to trash) */
    remove: (file: FileItem) => Promise<void>;
    /** Clear error */
    clearError: () => void;
}

/**
 * Builds breadcrumb segments from a path string.
 */
const buildBreadcrumbs = (path: string): BreadcrumbSegment[] => {
    const segments: BreadcrumbSegment[] = [{ name: 'Home', path: '' }];
    if (!path) return segments;

    const parts = path.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        segments.push({ name: part, path: currentPath });
    }

    return segments;
};

/**
 * Combined hook for browsing files and folders.
 * Fetches both folder contents (for subfolders) and file metadata from DB.
 */
export const useFileBrowser = (): UseFileBrowserState & UseFileBrowserActions => {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Build breadcrumbs
    const breadcrumbs = buildBreadcrumbs(currentPath);

    /**
     * Fetch folder contents and files for a given path.
     * - Folder contents come from filesystem (via /folders/list)
     * - File metadata comes from DB (via /files with filtering)
     */
    const fetchContents = useCallback(async (path: string) => {
        setError(null);
        setIsLoading(true);
        try {
            // Fetch folder contents (files + subfolders from filesystem)
            const folderResponse = await listFolderContents(path);

            // Extract only folders from the response
            const subfolders = folderResponse.contents.filter(
                (entry) => entry.type === 'folder'
            );

            // Fetch file metadata from database (active files only)
            const fileResponse = await listFiles('active');

            // Filter files that belong to current folder based on storagePath
            const currentFolderFiles = fileResponse.files.filter((file) => {
                const fileFolderPath = file.storagePath.split('/').slice(0, -1).join('/');
                return fileFolderPath === path;
            });

            setCurrentPath(path);
            setFolders(subfolders);
            setFiles(currentFolderFiles);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load contents';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Navigate to a path
    const navigateTo = useCallback(async (path: string) => {
        await fetchContents(path);
    }, [fetchContents]);

    // Navigate up one level
    const navigateUp = useCallback(async () => {
        if (!currentPath) return;
        const parentPath = currentPath.split('/').slice(0, -1).join('/');
        await navigateTo(parentPath);
    }, [currentPath, navigateTo]);

    // Refresh current view
    const refresh = useCallback(async () => {
        await fetchContents(currentPath);
    }, [currentPath, fetchContents]);

    // Upload file to current folder
    const upload = useCallback(async (file: File) => {
        setError(null);
        setIsLoading(true);
        try {
            await uploadFile(file, currentPath || undefined);
            await refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [currentPath, refresh]);

    // Download a file
    const download = useCallback(async (file: FileItem) => {
        setError(null);
        try {
            const blob = await downloadFileById(file.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Download failed';
            setError(msg);
        }
    }, []);

    // Soft-delete a file
    const remove = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await softDeleteFile(file.id);
            await refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Delete failed';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [refresh]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Fetch contents on mount
    useEffect(() => {
        fetchContents('');
    }, [fetchContents]);

    return {
        currentPath,
        files,
        folders,
        breadcrumbs,
        isLoading,
        error,
        navigateTo,
        navigateUp,
        refresh,
        upload,
        download,
        remove,
        clearError,
    };
};
