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

/** File status from backend (active or soft-deleted) */
export type FileStatus = 'active' | 'deleted';

// ============================================
// File Item (Backend Model)
// ============================================

/**
 * FileItem represents a file record from the backend.
 * Maps to the files table schema with camelCase keys.
 */
export interface FileItem {
    /** Unique file ID (UUID) */
    id: string;
    /** Original filename uploaded by user */
    originalName: string;
    /** Server-generated stored filename */
    storedName: string;
    /** MIME type of the file */
    mimeType: string | null;
    /** File size in bytes */
    size: number | null;
    /** SHA-256 hash for integrity */
    hashSha256: string | null;
    /** Storage provider (e.g., 'local') */
    storageProvider: string;
    /** Relative path within FILES_DIR */
    storagePath: string;
    /** Owner user ID */
    ownerId: string | null;
    /** Whether file is publicly accessible */
    isPublic: boolean;
    /** Number of times file was accessed */
    accessCount: number;
    /** Last access timestamp */
    lastAccessed: string | null;
    /** File status: 'active' or 'deleted' */
    status: FileStatus;
    /** Optional JSON metadata */
    metadataJson: string | null;
    /** Creation timestamp */
    createdAt: string;
    /** Last update timestamp */
    updatedAt: string | null;
}

// ============================================
// API Response Types
// ============================================

/** Response from GET /api/files - list of user's files */
export interface FileListResponse {
    files: FileItem[];
}

/** Response from POST /api/files/upload */
export interface UploadResponse {
    message: string;
    file: FileItem;
}

/** Response from soft-delete/restore operations */
export interface FileActionResponse {
    message: string;
    file: FileItem;
}

/** Response from permanent delete */
export interface DeleteResponse {
    message: string;
    id: string;
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
    /** File data object */
    file: FileItem;
    /** Card layout variant */
    variant?: 'list' | 'grid';
    /** Download action callback */
    onDownload?: (file: FileItem) => void;
    /** Delete/trash action callback */
    onDelete?: (file: FileItem) => void;
    /** Restore action callback (for trash view) */
    onRestore?: (file: FileItem) => void;
    /** Permanent delete callback (for trash view) */
    onPermanentDelete?: (file: FileItem) => void;
    /** Additional CSS classes */
    className?: string;
}
