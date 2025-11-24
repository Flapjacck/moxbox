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

export default {
    inferFileType,
};
