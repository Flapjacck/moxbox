/**
 * Folder Service
 * ===============
 * API call wrappers for folder management endpoints.
 * Handles create, rename, delete, and list operations.
 */

import { apiFetch } from '../../../api';
import { getToken, clearToken } from '../../auth/services/authService';
import type {
    FolderListResponse,
    CreateFolderResponse,
    RenameFolderResponse,
    DeleteFolderResponse,
} from '../types/folder.types';

// ============================================
// Helper Functions
// ============================================

/**
 * Gets authorization headers with current token.
 * @throws Error if no token is available
 */
const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated. Please log in.');
    }
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

/**
 * Handles API error responses consistently.
 * Clears token on 401 (session expired).
 */
const handleErrorResponse = async (response: Response): Promise<never> => {
    if (response.status === 401) {
        clearToken();
        throw new Error('Session expired. Please log in again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed. Please try again.');
};

// ============================================
// API Calls
// ============================================

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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        body: JSON.stringify({ path }),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};
