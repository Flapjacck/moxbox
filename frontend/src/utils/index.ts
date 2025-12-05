/**
 * Utility Exports
 * ================
 * Central barrel file for shared utilities.
 */

// API helpers (auth headers, error handling, type guards)
export {
    type ApiError,
    isApiError,
    getAuthHeaders,
    getAuthJsonHeaders,
    parseApiError,
    handleErrorResponse,
    getErrorMessage,
} from './apiHelpers';

// Breadcrumb utilities
export { buildBreadcrumbs, getParentPath } from './breadcrumbs';

// Download utilities
export { downloadBlob, isPreviewableImage, isPreviewablePdf, isPreviewableVideo, isPreviewableAudio, isPreviewableText, isPreviewable, getPreviewType } from './download';
