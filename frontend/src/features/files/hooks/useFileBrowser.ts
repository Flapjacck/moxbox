/**
 * useFileBrowser Hook - Combined file/folder browsing with navigation and operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { listFolderContents } from '../../folders/services/folderService';
import { listFiles, uploadFiles as uploadFilesService } from '../services/fileService';
import { useFileOperations, type PendingBatchUpload } from './useFileOperations';
import { buildBreadcrumbs, getParentPath } from '../../../utils/breadcrumbs';
import { isApiError, getErrorMessage } from '../../../utils/apiHelpers';
import type { FileItem, BatchUploadResponse } from '../types/file.types';
import type { DirectoryEntry, BreadcrumbSegment } from '../../folders/types/folder.types';

// Re-export for consumers
export type { PendingBatchUpload };

/** State shape for file browser */
export interface UseFileBrowserState {
    currentPath: string;
    files: FileItem[];
    folders: DirectoryEntry[];
    breadcrumbs: BreadcrumbSegment[];
    isLoading: boolean;
    error: string | null;
    lastBatchResult: BatchUploadResponse | null;
    pendingBatchUpload: PendingBatchUpload | null;
}

/** Actions for file browser */
export interface UseFileBrowserActions {
    navigateTo: (path: string) => Promise<void>;
    navigateUp: () => Promise<void>;
    refresh: () => Promise<void>;
    upload: (file: File, action?: 'replace' | 'keep_both') => Promise<void>;
    uploadMultiple: (files: File[], action?: 'replace' | 'keep_both') => Promise<BatchUploadResponse | null>;
    resolveBatchConflict: (action: 'replace' | 'keep_both') => Promise<void>;
    cancelBatchUpload: () => void;
    download: (file: FileItem) => Promise<void>;
    remove: (file: FileItem) => Promise<void>;
    clearError: () => void;
    clearBatchResult: () => void;
}

/** Combined hook for browsing files and folders. */
export const useFileBrowser = (): UseFileBrowserState & UseFileBrowserActions => {
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastBatchResult, setLastBatchResult] = useState<BatchUploadResponse | null>(null);
    const [pendingBatchUpload, setPendingBatchUpload] = useState<PendingBatchUpload | null>(null);

    // File operations from shared hook
    const fileOps = useFileOperations(currentPath);

    // Derived: breadcrumbs from current path
    const breadcrumbs = buildBreadcrumbs(currentPath);

    /** Fetch folder contents and files for a given path */
    const fetchContents = useCallback(async (path: string) => {
        setError(null);
        setIsLoading(true);
        try {
            // Fetch folder contents (files + subfolders from filesystem)
            const folderResponse = await listFolderContents(path);
            const subfolders = folderResponse.contents.filter((e) => e.type === 'folder');

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
            setError(getErrorMessage(err, 'Failed to load contents'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const navigateTo = useCallback(async (path: string) => {
        await fetchContents(path);
    }, [fetchContents]);

    const navigateUp = useCallback(async () => {
        if (!currentPath) return;
        await navigateTo(getParentPath(currentPath));
    }, [currentPath, navigateTo]);

    const refresh = useCallback(async () => {
        await fetchContents(currentPath);
    }, [currentPath, fetchContents]);

    const upload = useCallback(async (file: File, action?: 'replace' | 'keep_both') => {
        setError(null);
        setIsLoading(true);
        try {
            await fileOps.upload(file, action);
            await refresh();
        } catch (err: unknown) {
            // Bubble up 409 conflicts for caller to handle
            if (isApiError(err) && err.status === 409) throw err;
            setError(getErrorMessage(err, 'Upload failed'));
        } finally {
            setIsLoading(false);
        }
    }, [fileOps, refresh]);

    const uploadMultiple = useCallback(async (
        files: File[],
        action?: 'replace' | 'keep_both'
    ): Promise<BatchUploadResponse | null> => {
        setError(null);
        setLastBatchResult(null);
        setIsLoading(true);

        try {
            const result = await fileOps.uploadMultiple(files, action);

            // Handle conflicts
            if (result.pendingUpload) {
                setPendingBatchUpload(result.pendingUpload);
                setIsLoading(false);
                return null;
            }

            // Handle errors
            if (result.error) {
                setError(result.error);
                setIsLoading(false);
                return null;
            }

            // Success
            setLastBatchResult(result.response);
            setPendingBatchUpload(null);
            await refresh();
            return result.response;
        } catch (err) {
            setError(getErrorMessage(err, 'Batch upload failed'));
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [fileOps, refresh]);

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
            setError(getErrorMessage(err, 'Upload failed'));
            setPendingBatchUpload(null);
        } finally {
            setIsLoading(false);
        }
    }, [pendingBatchUpload, currentPath, refresh]);

    const cancelBatchUpload = useCallback(() => {
        setPendingBatchUpload(null);
    }, []);

    const download = useCallback(async (file: FileItem) => {
        setError(null);
        try {
            await fileOps.download(file);
        } catch (err) {
            setError(getErrorMessage(err, 'Download failed'));
        }
    }, [fileOps]);

    const remove = useCallback(async (file: FileItem) => {
        setError(null);
        setIsLoading(true);
        try {
            await fileOps.remove(file);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, 'Delete failed'));
        } finally {
            setIsLoading(false);
        }
    }, [fileOps, refresh]);

    const clearError = useCallback(() => setError(null), []);
    const clearBatchResult = useCallback(() => setLastBatchResult(null), []);

    useEffect(() => { fetchContents(''); }, [fetchContents]);

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
