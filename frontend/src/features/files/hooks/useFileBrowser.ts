/**
 * useFileBrowser Hook
 * ====================
 * Combined file/folder browsing with navigation and upload operations.
 * Uses useUploadWithProgress for upload logic.
 * Syncs current path with URL query parameter (?path=...) for persistence.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listFolderContents } from '../../folders/services/folderService';
import { listFiles } from '../services/fileService';
import { useUploadWithProgress, type PendingBatchUpload } from './useUploadWithProgress';
import { useFileOperations } from './useFileOperations';
import { buildBreadcrumbs, getParentPath, getErrorMessage } from '../../../utils';
import type { FileItem, BatchUploadResponse, UploadProgress } from '../types/file.types';
import type { DirectoryEntry, BreadcrumbSegment } from '../../folders/types/folder.types';

// Re-export for consumers
export type { PendingBatchUpload };

// ============================================
// Types
// ============================================

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
    uploadProgress: UploadProgress;
}

/** Actions for file browser */
export interface UseFileBrowserActions {
    navigateTo: (path: string) => Promise<void>;
    navigateUp: () => Promise<void>;
    refresh: () => Promise<void>;
    upload: (file: File, action?: 'replace' | 'keep_both') => Promise<void>;
    uploadMultiple: (files: File[], action?: 'replace' | 'keep_both') => Promise<BatchUploadResponse | null>;
    resolveBatchConflict: (action: 'replace' | 'keep_both') => Promise<void>;
    cancelUpload: () => void;
    cancelBatchUpload: () => void;
    download: (file: FileItem) => Promise<void>;
    remove: (file: FileItem) => Promise<void>;
    clearError: () => void;
    clearBatchResult: () => void;
}

// ============================================
// Hook
// ============================================

/** Combined hook for browsing files and folders with upload support. */
export const useFileBrowser = (): UseFileBrowserState & UseFileBrowserActions => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentPath, setCurrentPath] = useState('');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<DirectoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastBatchResult, setLastBatchResult] = useState<BatchUploadResponse | null>(null);

    // File download/delete operations
    const fileOps = useFileOperations(currentPath);

    // Derived: breadcrumbs from current path
    const breadcrumbs = buildBreadcrumbs(currentPath);

    /** Fetch folder contents and files for a given path */
    const fetchContents = useCallback(async (path: string) => {
        setError(null);
        setIsLoading(true);
        try {
            const folderResponse = await listFolderContents(path);
            const subfolders = folderResponse.contents.filter((e) => e.type === 'folder');
            const fileResponse = await listFiles('active');
            const currentFolderFiles = fileResponse.files.filter((file) => {
                const fileFolderPath = file.storagePath.split('/').slice(0, -1).join('/');
                return fileFolderPath === path;
            });
            setCurrentPath(path);
            setFolders(subfolders);
            setFiles(currentFolderFiles);
        } catch (err) {
            // If path doesn't exist or is invalid, fallback to root
            const errorMsg = getErrorMessage(err, 'Folder not found');
            if (path !== '') {
                setError(`${errorMsg}. Returning to root.`);
                setCurrentPath('');
                setFolders([]);
                setFiles([]);
                // Update URL to root without path param
                setSearchParams({});
                // Recursively load root
                await fetchContents('');
            } else {
                setError(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    }, [setSearchParams]);

    const refresh = useCallback(async () => {
        await fetchContents(currentPath);
    }, [currentPath, fetchContents]);

    // Upload operations with progress
    const uploadOps = useUploadWithProgress(refresh, setError);

    const navigateTo = useCallback(async (path: string) => {
        await fetchContents(path);
        // Update URL with path param (omit if empty/root)
        if (path) {
            setSearchParams({ path });
        } else {
            setSearchParams({});
        }
    }, [fetchContents, setSearchParams]);

    const navigateUp = useCallback(async () => {
        if (!currentPath) return;
        await navigateTo(getParentPath(currentPath));
    }, [currentPath, navigateTo]);

    // Wrap upload to use current path
    const upload = useCallback(async (file: File, action?: 'replace' | 'keep_both') => {
        await uploadOps.upload(file, currentPath, action);
    }, [uploadOps, currentPath]);

    const uploadMultiple = useCallback(async (
        files: File[],
        action?: 'replace' | 'keep_both'
    ): Promise<BatchUploadResponse | null> => {
        const result = await uploadOps.uploadMultiple(files, currentPath, action);
        if (result) setLastBatchResult(result);
        return result;
    }, [uploadOps, currentPath]);

    const resolveBatchConflict = useCallback(async (action: 'replace' | 'keep_both') => {
        const result = await uploadOps.resolveBatchConflict(currentPath, action);
        if (result) setLastBatchResult(result);
    }, [uploadOps, currentPath]);

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

    // On mount: restore path from URL or start at root
    useEffect(() => {
        const pathParam = searchParams.get('path') || '';
        fetchContents(pathParam);
    }, [fetchContents, searchParams]);

    return {
        currentPath,
        files,
        folders,
        breadcrumbs,
        isLoading,
        error,
        lastBatchResult,
        pendingBatchUpload: uploadOps.pendingBatchUpload,
        uploadProgress: uploadOps.uploadProgress,
        navigateTo,
        navigateUp,
        refresh,
        upload,
        uploadMultiple,
        resolveBatchConflict,
        cancelUpload: uploadOps.cancelUpload,
        cancelBatchUpload: uploadOps.cancelBatchUpload,
        download,
        remove,
        clearError,
        clearBatchResult,
    };
};
