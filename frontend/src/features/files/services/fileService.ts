/**
 * File Service
 * =============
 * API call wrappers for file management endpoints.
 * Handles list, upload, download, and delete operations.
 */

import { apiFetch } from '../../../api';
import { getToken, clearToken } from '../../auth/services/authService';
import type { FileListResponse, UploadResponse, DeleteResponse } from '../types/file.types';

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
    return { Authorization: `Bearer ${token}` };
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
 * Fetches list of user's files.
 * @param pattern - Optional filter pattern for filenames
 */
export const listFiles = async (pattern?: string): Promise<FileListResponse> => {
    const url = pattern ? `/files?pattern=${encodeURIComponent(pattern)}` : '/files';

    const response = await apiFetch(url, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.json();
};

/**
 * Uploads a file to the server.
 * @param file - File object to upload
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch('/files/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.json();
};

/**
 * Downloads a file as a blob.
 * @param filename - Name of file to download
 */
export const downloadFile = async (filename: string): Promise<Blob> => {
    const response = await apiFetch(`/files/${encodeURIComponent(filename)}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.blob();
};

/**
 * Deletes a file from the server.
 * @param filename - Name of file to delete
 */
export const deleteFile = async (filename: string): Promise<DeleteResponse> => {
    const response = await apiFetch(`/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        await handleErrorResponse(response);
    }

    return response.json();
};