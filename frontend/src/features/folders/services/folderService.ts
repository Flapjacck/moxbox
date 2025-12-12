/**
 * Folder Service
 * ===============
 * API call wrappers for folder management endpoints.
 * Handles create, rename, delete, and list operations.
 */

import { apiFetch } from '../../../api';
import { getAuthHeaders, getAuthJsonHeaders, handleErrorResponse } from '../../../utils';
import type {
    FolderListResponse,
    CreateFolderResponse,
    RenameFolderResponse,
    DeleteFolderResponse,
} from '../types/folder.types';



// ============================================
// API Calls
// ============================================

/**
 * Gets root folder size info (total space used at root level).
 */
export const getRootFolderInfo = async (): Promise<{ path: string; size: number }> => {
    const response = await apiFetch('/folders/root', { headers: getAuthHeaders() });
    if (!response.ok) await handleErrorResponse(response);

    return response.json();
};

/**
 * Lists contents of a folder (files and subfolders).
 * @param path - Relative folder path (empty string for root)
 */
export const listFolderContents = async (path: string = ''): Promise<FolderListResponse> => {
    const params = new URLSearchParams();
    if (path) params.set('path', path);
    const url = params.toString() ? `/folders/list?${params}` : '/folders/list';

    const response = await apiFetch(url, { headers: getAuthHeaders() });
    if (!response.ok) await handleErrorResponse(response);

    return response.json();
};

/**
 * Creates a new folder.
 * @param path - Relative path for the new folder
 */
export const createFolder = async (path: string): Promise<CreateFolderResponse> => {
    const response = await apiFetch('/folders', {
        method: 'POST',
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({ path }),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};

/**
 * Renames (moves) a folder.
 * @param oldPath - Current folder path
 * @param newPath - New folder path
 */
export const renameFolder = async (
    oldPath: string,
    newPath: string
): Promise<RenameFolderResponse> => {
    const response = await apiFetch('/folders/rename', {
        method: 'PATCH',
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({ oldPath, newPath }),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};

/**
 * Deletes an empty folder.
 * @param path - Folder path to delete
 */
export const deleteFolder = async (path: string): Promise<DeleteFolderResponse> => {
    const response = await apiFetch('/folders', {
        method: 'DELETE',
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({ path }),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};
