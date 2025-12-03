/**
 * File Service
 * =============
 * API call wrappers for file management endpoints.
 * Handles list, upload (single & batch), download, delete, restore, and metadata operations.
 * All file operations use ID-based endpoints for security.
 */

import { apiFetch } from '../../../api';
import { getToken, clearToken } from '../../auth/services/authService';
import type {
    FileItem,
    FileListResponse,
    UploadResponse,
    BatchUploadResponse,
    FileActionResponse,
    DeleteResponse,
} from '../types/file.types';

// ============================================
// Snake_case to camelCase Mapper
// ============================================

/**
 * Converts a snake_case backend file record to camelCase FileItem.
 * Keeps frontend code idiomatic while matching backend schema.
 */
const mapFileRecord = (record: Record<string, unknown>): FileItem => ({
    id: record.id as string,
    originalName: record.original_name as string,
    storedName: record.stored_name as string,
    mimeType: record.mime_type as string | null,
    size: record.size as number | null,
    hashSha256: record.hash_sha256 as string | null,
    storageProvider: record.storage_provider as string,
    storagePath: record.storage_path as string,
    ownerId: record.owner_id as string | null,
    isPublic: Boolean(record.is_public),
    accessCount: (record.access_count as number) ?? 0,
    lastAccessed: record.last_accessed as string | null,
    status: (record.status as 'active' | 'deleted') ?? 'active',
    metadataJson: record.metadata_json as string | null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string | null,
});

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
    const message = errorData.message || 'Request failed. Please try again.';
    type ApiError = Error & { status?: number; payload?: unknown };
    const apiErr = new Error(message) as ApiError;
    apiErr.status = response.status;
    apiErr.payload = errorData;
    throw apiErr;
};

// ============================================
// API Calls
// ============================================

/**
 * Fetches list of user's files (active files only by default).
 * @param status - Optional filter for file status ('active' | 'deleted')
 */
export const listFiles = async (status?: string): Promise<FileListResponse> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const url = params.toString() ? `/files?${params}` : '/files';

    const response = await apiFetch(url, { headers: getAuthHeaders() });
    if (!response.ok) await handleErrorResponse(response);

    const data = await response.json();
    return { files: (data.files || []).map(mapFileRecord) };
};

/**
 * Uploads a file to the server.
 * @param file - File object to upload
 * @param folder - Optional subfolder path within FILES_DIR
 */
export const uploadFile = async (file: File, folder?: string, action?: 'replace' | 'keep_both'): Promise<UploadResponse> => {
    const formData = new FormData();
    // IMPORTANT: folder must be appended BEFORE the file for multer to read it
    // in the destination callback (multipart fields are parsed in order)
    if (folder) formData.append('folder', folder);
    if (action) formData.append('action', action);
    formData.append('file', file);

    // Note: Don't set Content-Type header for FormData; browser sets boundary
    const response = await apiFetch('/files/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    if (!response.ok) await handleErrorResponse(response);

    const data = await response.json();
    return { message: data.message, file: mapFileRecord(data.file) };
};

/**
 * Downloads a file by ID as a blob.
 * @param fileId - UUID of the file to download
 */
export const downloadFileById = async (fileId: string): Promise<Blob> => {
    const response = await apiFetch(`/files/id/${encodeURIComponent(fileId)}`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.blob();
};

/**
 * Soft-deletes a file (moves to trash).
 * @param fileId - UUID of the file to soft-delete
 */
export const softDeleteFile = async (fileId: string): Promise<FileActionResponse> => {
    const response = await apiFetch(`/files/id/${encodeURIComponent(fileId)}/soft-delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!response.ok) await handleErrorResponse(response);

    const data = await response.json();
    return { message: data.message, file: mapFileRecord(data.file) };
};

/**
 * Restores a soft-deleted file from trash.
 * @param fileId - UUID of the file to restore
 */
export const restoreFile = async (fileId: string): Promise<FileActionResponse> => {
    const response = await apiFetch(`/files/id/${encodeURIComponent(fileId)}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!response.ok) await handleErrorResponse(response);

    const data = await response.json();
    return { message: data.message, file: mapFileRecord(data.file) };
};

/**
 * Permanently deletes a file (cannot be undone).
 * @param fileId - UUID of the file to permanently delete
 */
export const permanentDeleteFile = async (fileId: string): Promise<DeleteResponse> => {
    const response = await apiFetch(`/files/id/${encodeURIComponent(fileId)}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};

/**
 * Uploads multiple files to the server in a single batch request.
 * Preserves folder structure via webkitRelativePath for folder uploads.
 *
 * If conflicts are detected, returns a 409 error with conflict info.
 * The caller should catch this and re-call with an action parameter.
 *
 * @param files - Array of File objects to upload
 * @param baseFolder - Optional base folder path to upload into
 * @param action - Optional conflict resolution action: 'replace' | 'keep_both'
 * @returns BatchUploadResponse with per-file results
 * @throws Error with status 409 if conflicts detected (check error.payload for details)
 */
export const uploadFiles = async (
    files: File[],
    baseFolder?: string,
    action?: 'replace' | 'keep_both'
): Promise<BatchUploadResponse> => {
    const formData = new FormData();

    // Append base folder first (will be combined with per-file relative paths)
    if (baseFolder) {
        formData.append('folder', baseFolder);
    }

    // Append conflict resolution action if provided
    if (action) {
        formData.append('action', action);
    }

    // For each file, append its relativePath (if any) BEFORE the file
    // This order is critical for multer to associate metadata with files
    for (const file of files) {
        // webkitRelativePath contains the full path from folder root (e.g., "myFolder/sub/file.txt")
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
        formData.append('relativePath', relativePath);
        formData.append('file', file);
    }

    const response = await apiFetch('/files/upload/batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    if (!response.ok) await handleErrorResponse(response);
    return response.json();
};