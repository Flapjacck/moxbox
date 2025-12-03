/**
 * Breadcrumb Utilities
 * =====================
 * Shared breadcrumb building logic for folder navigation.
 * Used by useFileBrowser, useFolders, and Breadcrumbs component.
 */

import type { BreadcrumbSegment } from '../features/folders/types/folder.types';

/**
 * Builds an array of breadcrumb segments from a path string.
 *
 * @param path - Current folder path (e.g., "projects/2024/docs")
 * @param rootLabel - Label for the root segment (default: "Home")
 * @returns Array of BreadcrumbSegment with name and cumulative path
 *
 * @example
 * buildBreadcrumbs('projects/2024/docs')
 * // Returns:
 * // [
 * //   { name: 'Home', path: '' },
 * //   { name: 'projects', path: 'projects' },
 * //   { name: '2024', path: 'projects/2024' },
 * //   { name: 'docs', path: 'projects/2024/docs' }
 * // ]
 */
export const buildBreadcrumbs = (
    path: string,
    rootLabel = 'Home'
): BreadcrumbSegment[] => {
    // Always start with root
    const segments: BreadcrumbSegment[] = [{ name: rootLabel, path: '' }];

    // Return early if at root
    if (!path) return segments;

    // Split path and build cumulative segments
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';

    for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        segments.push({ name: part, path: currentPath });
    }

    return segments;
};

/**
 * Gets the parent path from a given path.
 *
 * @param path - Current folder path
 * @returns Parent path, or empty string if already at root
 *
 * @example
 * getParentPath('projects/2024/docs') // 'projects/2024'
 * getParentPath('projects') // ''
 * getParentPath('') // ''
 */
export const getParentPath = (path: string): string => {
    if (!path) return '';
    return path.split('/').slice(0, -1).join('/');
};
