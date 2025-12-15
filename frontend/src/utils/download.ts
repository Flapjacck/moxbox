/**
 * Download Utilities
 * ===================
 * Shared helpers for programmatic file downloads.
 * Used by useFiles, useFileBrowser, and any component needing download behavior.
 */

/**
 * Triggers a browser download for a Blob with the given filename.
 *
 * Creates a temporary object URL, triggers a click on a hidden anchor,
 * then cleans up the URL to avoid memory leaks.
 *
 * @param blob - The file data as a Blob
 * @param filename - The suggested filename for the download
 *
 * @example
 * const blob = await fetchFileAsBlob(fileId);
 * downloadBlob(blob, 'document.pdf');
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);

    // Create hidden anchor and trigger download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Release the object URL to free memory
    URL.revokeObjectURL(url);
};

/**
 * Determines if a MIME type represents an image that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a previewable image
 */
export const isPreviewableImage = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    const normalizedMimeType = mimeType.trim().toLowerCase();
    const previewable = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];
    return previewable.includes(normalizedMimeType);
};

/**
 * Determines if a MIME type represents a PDF that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a PDF
 */
export const isPreviewablePdf = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    const normalizedMimeType = mimeType.trim().toLowerCase();
    return normalizedMimeType === 'application/pdf';
};

/**
 * Determines if a MIME type represents a video that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a previewable video
 */
export const isPreviewableVideo = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    const normalizedMimeType = mimeType.trim().toLowerCase();
    const previewable = ['video/mp4', 'video/webm', 'video/ogg'];
    return previewable.includes(normalizedMimeType);
};

/**
 * Determines if a MIME type represents an audio file that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a previewable audio file
 */
export const isPreviewableAudio = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    const normalizedMimeType = mimeType.trim().toLowerCase();
    const previewable = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3'];
    return previewable.includes(normalizedMimeType);
};

/**
 * Determines if a MIME type represents a text/code file that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a previewable text file
 */
export const isPreviewableText = (mimeType: string | null): boolean => {
    if (!mimeType) return false;
    // Normalize: trim whitespace and convert to lowercase
    const normalizedMimeType = mimeType.trim().toLowerCase();
    const textTypes = [
        'text/plain',
        'text/markdown',
        'text/typescript',
        'text/csv',
        'text/css',
        'text/javascript',
        'text/html',
        'text/xml',
        'application/json',
        'application/xml',
        'application/javascript',
    ];
    // Also match any text/* type
    return textTypes.includes(normalizedMimeType) || normalizedMimeType.startsWith('text/');
};

/**
 * Determines if a file can be previewed based on its MIME type.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file supports preview
 */
export const isPreviewable = (mimeType: string | null): boolean => {
    return (
        isPreviewableImage(mimeType) ||
        isPreviewablePdf(mimeType) ||
        isPreviewableVideo(mimeType) ||
        isPreviewableAudio(mimeType) ||
        isPreviewableText(mimeType)
    );
};

/**
 * Returns the preview type category for a given MIME type.
 *
 * @param mimeType - The file's MIME type
 * @returns Preview type: 'image' | 'pdf' | 'video' | 'audio' | 'text' | null
 */
export const getPreviewType = (
    mimeType: string | null
): 'image' | 'pdf' | 'video' | 'audio' | 'text' | null => {
    if (isPreviewableImage(mimeType)) return 'image';
    if (isPreviewablePdf(mimeType)) return 'pdf';
    if (isPreviewableVideo(mimeType)) return 'video';
    if (isPreviewableAudio(mimeType)) return 'audio';
    if (isPreviewableText(mimeType)) return 'text';
    return null;
};
