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
    const previewable = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ];
    return previewable.includes(mimeType);
};

/**
 * Determines if a MIME type represents a PDF that can be previewed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file is a PDF
 */
export const isPreviewablePdf = (mimeType: string | null): boolean => {
    return mimeType === 'application/pdf';
};
