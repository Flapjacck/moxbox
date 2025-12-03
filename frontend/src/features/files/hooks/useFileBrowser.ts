/**
 * useFileBrowser Hook
 * ====================
 * Combined hook for file and folder browsing.
 * Manages navigation, file operations, and folder operations in one place.
 * Supports single-file and batch (folder) uploads.
 */

import { useState, useCallback, useEffect } from 'react';
import { listFolderContents } from '../../folders/services/folderService';
import {
    listFiles,
    uploadFile,
    uploadFiles as uploadFilesService,
    downloadFileById,
    softDeleteFile,
} from '../services/fileService';
import type { FileItem, BatchUploadResponse, BatchConflictInfo } from '../types/file.types';
import type { DirectoryEntry, BreadcrumbSegment } from '../../folders/types/folder.types';

/** Pending batch upload waiting for conflict resolution */
export interface PendingBatchUpload {
    files: File[];
    conflicts: BatchConflictInfo[];
    totalFiles: number;
}

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
    /** Last batch upload result (for showing summary) */
    lastBatchResult: BatchUploadResponse | null;
    /** Pending batch upload with conflicts awaiting user action */
    pendingBatchUpload: PendingBatchUpload | null;
}

/** Actions for file browser */
export interface UseFileBrowserActions {
    /** Navigate to a folder */
    navigateTo: (path: string) => Promise<void>;
    /** Navigate up one level */
    navigateUp: () => Promise<void>;
    /** Refresh current view */
    refresh: () => Promise<void>;
    /** Upload a single file to current folder */
    upload: (file: File, action?: 'replace' | 'keep_both') => Promise<void>;
    /** Upload multiple files to current folder (preserves structure) */
    uploadMultiple: (files: File[], action?: 'replace' | 'keep_both') => Promise<BatchUploadResponse | null>;
    /** Resolve pending batch upload conflicts */
    resolveBatchConflict: (action: 'replace' | 'keep_both') => Promise<void>;
    /** Cancel pending batch upload */
    cancelBatchUpload: () => void;
    /** Download a file */
    download: (file: FileItem) => Promise<void>;
    /** Soft-delete a file (move to trash) */
    remove: (file: FileItem) => Promise<void>;
    /** Clear error */
    clearError: () => void;
    /** Clear last batch result */
    clearBatchResult: () => void;
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
    const [lastBatchResult, setLastBatchResult] = useState<BatchUploadResponse | null>(null);
    const [pendingBatchUpload, setPendingBatchUpload] = useState<PendingBatchUpload | null>(null);

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
    const upload = useCallback(async (file: File, action?: 'replace' | 'keep_both') => {
        setError(null);
        setIsLoading(true);
        try {
            await uploadFile(file, currentPath || undefined, action);
            await refresh();
        } catch (err: unknown) {
            // If backend returned 409 conflict, bubble up the error so the caller can present a choice to the user
            type ApiError = Error & { status?: number };
            const isApiError = (v: unknown): v is ApiError => (typeof v === 'object' && v !== null && 'status' in (v as Record<string, unknown>));
            if (isApiError(err) && err.status === 409) {
                throw err;
            }
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

    // Upload multiple files (batch/folder upload)
    const uploadMultiple = useCallback(async (
        files: File[],
        action?: 'replace' | 'keep_both'
    ): Promise<BatchUploadResponse | null> => {
        setError(null);
        setLastBatchResult(null);
        setIsLoading(true);
        try {
            const result = await uploadFilesService(files, currentPath || undefined, action);
            setLastBatchResult(result);
            setPendingBatchUpload(null);
            await refresh();
            return result;
        } catch (err: unknown) {
            // Check if this is a 409 conflict response
            type ApiError = Error & { status?: number; payload?: { conflicts?: BatchConflictInfo[]; totalFiles?: number; trashedConflicts?: string[] } };
            const isApiError = (v: unknown): v is ApiError =>
                typeof v === 'object' && v !== null && 'status' in (v as Record<string, unknown>);

            if (isApiError(err) && err.status === 409 && err.payload?.conflicts) {
                // Store pending upload for user resolution
                setPendingBatchUpload({
                    files,
                    conflicts: err.payload.conflicts,
                    totalFiles: err.payload.totalFiles || files.length,
                });
                setIsLoading(false);
                return null; // Signal that conflicts need resolution
            }

            // Handle trashed conflicts
            if (isApiError(err) && err.status === 409 && err.payload?.trashedConflicts) {
                setError(`Some files exist in Trash: ${err.payload.trashedConflicts.join(', ')}. Remove them from Trash first.`);
                setIsLoading(false);
                return null;
            }

            const msg = err instanceof Error ? err.message : 'Batch upload failed';
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [currentPath, refresh]);

    // Resolve pending batch upload conflicts
    const resolveBatchConflict = useCallback(async (action: 'replace' | 'keep_both') => {
        if (!pendingBatchUpload) return;

        setIsLoading(true);
        try {
            const result = await uploadFilesService(
                pendingBatchUpload.files,
                currentPath || undefined,
                action
            );
            setLastBatchResult(result);
            setPendingBatchUpload(null);
            await refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            setError(msg);
            setPendingBatchUpload(null);
        } finally {
            setIsLoading(false);
        }
    }, [pendingBatchUpload, currentPath, refresh]);

    // Cancel pending batch upload
    const cancelBatchUpload = useCallback(() => {
        setPendingBatchUpload(null);
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear last batch result
    const clearBatchResult = useCallback(() => setLastBatchResult(null), []);

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
        lastBatchResult,
        pendingBatchUpload,
        navigateTo,
        navigateUp,
        refresh,
        upload,
        uploadMultiple,
        resolveBatchConflict,
        cancelBatchUpload,
        download,
        remove,
        clearError,
        clearBatchResult,
    };
};
