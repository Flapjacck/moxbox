// ============================================
// File Type Categories
// ============================================

/** Supported file type categories for icon display */
export type FileType =
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'archive'
    | 'other';

// ============================================
// API Response Types
// ============================================

/** Response from GET /api/files - list of user's files */
export interface FileListResponse {
    files: string[];
}

/** Response from POST /api/files/upload */
export interface UploadResponse {
    message: string;
    filename: string;
    path: string;
}

/** Response from DELETE /api/files/:filename */
export interface DeleteResponse {
    message: string;
    filename: string;
}

/** Standard error response from file API */
export interface FileErrorResponse {
    message: string;
    details?: unknown;
}

// ============================================
// UI Component Props
// ============================================

/** Props for FileCard component */
export interface FileCardProps {
    /** Display filename */
    fileName: string;
    /** Optional override for inferred file type */
    fileType?: FileType;
    /** Card layout variant */
    variant?: 'list' | 'grid';
    /** Download action callback */
    onDownload?: () => void;
    /** Delete action callback */
    onDelete?: () => void;
    /** Additional CSS classes */
    className?: string;
}
