/**
 * Upload Service with Progress
 * =============================
 * XHR-based upload functions that support progress tracking and cancellation.
 * Used by useFileBrowser hook for upload operations.
 */

import { getApiUrl } from '../../../api';
import { getAuthHeaders } from '../../../utils';

// ============================================
// Types
// ============================================

/** Options for upload operations */
export interface UploadOptions {
    /** Progress callback (0-100) */
    onProgress?: (percent: number) => void;
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
}

/** Upload result from XHR */
export interface UploadResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    error?: string;
}

// ============================================
// XHR Upload Helper
// ============================================

/**
 * Performs an XHR upload with progress tracking.
 * Returns a promise that resolves with the parsed JSON response.
 */
function xhrUpload<T>(
    url: string,
    formData: FormData,
    options?: UploadOptions
): Promise<UploadResult<T>> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Track progress
        if (options?.onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    options.onProgress!(percent);
                }
            };
        }

        // Handle completion
        xhr.onload = () => {
            let data: T | null = null;
            try {
                data = JSON.parse(xhr.responseText);
            } catch {
                // Non-JSON response
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ ok: true, status: xhr.status, data });
            } else {
                const errorMsg = (data as any)?.message || `Upload failed (${xhr.status})`;
                resolve({ ok: false, status: xhr.status, data, error: errorMsg });
            }
        };

        // Handle network errors
        xhr.onerror = () => {
            resolve({ ok: false, status: 0, data: null, error: 'Network error' });
        };

        // Handle abort
        xhr.onabort = () => {
            resolve({ ok: false, status: 0, data: null, error: 'Upload cancelled' });
        };

        // Setup abort signal
        if (options?.signal) {
            options.signal.addEventListener('abort', () => xhr.abort());
        }

        // Send request
        xhr.open('POST', url);

        // Set auth headers (but not Content-Type - let browser set for FormData)
        const headers = getAuthHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            if (key.toLowerCase() !== 'content-type') {
                xhr.setRequestHeader(key, value);
            }
        });

        xhr.send(formData);
    });
}

// ============================================
// Upload Functions
// ============================================

/** Response shape from single file upload */
interface SingleUploadResponse {
    message: string;
    file: Record<string, unknown>;
}

/** Response shape from batch upload */
interface BatchUploadResponse {
    message: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    results: Array<{
        originalName: string;
        storagePath: string;
        success: boolean;
        message: string;
        fileId?: string;
        error?: string;
    }>;
}

/**
 * Upload a single file with progress tracking.
 *
 * @param file - File to upload
 * @param folder - Optional subfolder path
 * @param action - Conflict resolution: 'replace' | 'keep_both'
 * @param options - Progress and cancellation options
 */
export async function uploadFileWithProgress(
    file: File,
    folder?: string,
    action?: 'replace' | 'keep_both',
    options?: UploadOptions
): Promise<UploadResult<SingleUploadResponse>> {
    const formData = new FormData();

    // Order matters: folder/action before file
    if (folder) formData.append('folder', folder);
    if (action) formData.append('action', action);
    formData.append('file', file);

    const url = getApiUrl('/files/upload');
    return xhrUpload<SingleUploadResponse>(url, formData, options);
}

/**
 * Upload multiple files with progress tracking.
 * Preserves folder structure via webkitRelativePath.
 *
 * @param files - Array of files to upload
 * @param baseFolder - Optional base folder path
 * @param action - Conflict resolution: 'replace' | 'keep_both'
 * @param options - Progress and cancellation options
 */
export async function uploadFilesWithProgress(
    files: File[],
    baseFolder?: string,
    action?: 'replace' | 'keep_both',
    options?: UploadOptions
): Promise<UploadResult<BatchUploadResponse>> {
    const formData = new FormData();

    // Base folder first
    if (baseFolder) formData.append('folder', baseFolder);
    if (action) formData.append('action', action);

    // Append relativePath before each file (order matters for multer)
    for (const file of files) {
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
        formData.append('relativePath', relativePath);
        formData.append('file', file);
    }

    const url = getApiUrl('/files/upload/batch');
    return xhrUpload<BatchUploadResponse>(url, formData, options);
}
