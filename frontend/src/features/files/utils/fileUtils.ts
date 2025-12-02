/**
 * fileUtils
 * Small utilities related to file handling in the files feature.
 * Keep extraction and inference logic here so it can be shared
 * between UI components or other utility layers.
 */

import type { FileType } from '../types/file.types';

/**
 * inferFileType
 * Given a file name, guess a FileType from the extension.
 * This is a best-effort helper for the UI when backend metadata
 * like mimetype is not yet provided.
 */
export function inferFileType(name: string): FileType {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'mkv', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) return 'document';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'other';
}

/**
 * formatFileSize
 * Converts bytes to a human-readable string (KB, MB, GB).
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * formatDate
 * Formats an ISO date string to a readable local date.
 * @param isoString - ISO 8601 date string from backend
 */
export function formatDate(isoString: string | null): string {
    if (!isoString) return 'Unknown date';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
}

export default {
    inferFileType,
    formatFileSize,
    formatDate,
};
