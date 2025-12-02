/**
 * Folder Types
 * =============
 * Type definitions for folder management feature.
 */

// ============================================
// Directory Entry (from backend)
// ============================================

/** Represents a file or folder entry in a directory listing */
export interface DirectoryEntry {
    /** Entry name (file or folder name) */
    name: string;
    /** Entry type: 'file' or 'folder' */
    type: 'file' | 'folder';
    /** File size in bytes (only for files) */
    size?: number;
}

// ============================================
// API Response Types
// ============================================

/** Response from GET /api/folders/list */
export interface FolderListResponse {
    /** Current folder path */
    path: string;
    /** Array of files and subfolders */
    contents: DirectoryEntry[];
}

/** Response from POST /api/folders (create) */
export interface CreateFolderResponse {
    message: string;
    path: string;
}

/** Response from PATCH /api/folders/rename */
export interface RenameFolderResponse {
    message: string;
    oldPath: string;
    newPath: string;
}

/** Response from DELETE /api/folders */
export interface DeleteFolderResponse {
    message: string;
    path: string;
}

// ============================================
// UI Types
// ============================================

/** Breadcrumb segment for folder navigation */
export interface BreadcrumbSegment {
    /** Display name */
    name: string;
    /** Full path to this segment */
    path: string;
}
