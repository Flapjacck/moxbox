import path from 'path';

/**
 * pathSanitizer utility
 * - Validates and sanitizes user-provided folder paths
 * - Prevents directory traversal attacks (e.g., "../../../etc")
 * - Ensures paths stay within the allowed root directory
 */

/** Maximum allowed folder path depth */
const MAX_PATH_DEPTH = 10;

/** Maximum allowed path length */
const MAX_PATH_LENGTH = 255;

/** Allowed characters in folder names (alphanumeric, dash, underscore, spaces) */
const ALLOWED_FOLDER_CHARS = /^[a-zA-Z0-9_\- ]+$/;

/**
 * Sanitizes a user-provided folder path.
 * - Removes leading/trailing slashes and whitespace
 * - Blocks path traversal attempts (..)
 * - Validates character set and length
 *
 * @param folder - Raw folder path from user input
 * @returns Sanitized relative folder path (empty string for root)
 * @throws Error if path is invalid or potentially malicious
 */
export function sanitizeFolderPath(folder: string | undefined | null): string {
    // Handle empty/null input - return root
    if (!folder || typeof folder !== 'string') {
        return '';
    }

    // Trim whitespace
    let sanitized = folder.trim();

    // Return empty for root-level storage
    if (sanitized === '' || sanitized === '/' || sanitized === '\\') {
        return '';
    }

    // Normalize path separators to forward slashes
    sanitized = sanitized.replace(/\\/g, '/');

    // Remove leading and trailing slashes
    sanitized = sanitized.replace(/^\/+|\/+$/g, '');

    // Check for path traversal attempts
    if (sanitized.includes('..')) {
        throw new Error('Invalid folder path: path traversal not allowed');
    }

    // Check total length
    if (sanitized.length > MAX_PATH_LENGTH) {
        throw new Error(`Invalid folder path: exceeds maximum length of ${MAX_PATH_LENGTH}`);
    }

    // Split into segments and validate each
    const segments = sanitized.split('/').filter(Boolean);

    // Check depth
    if (segments.length > MAX_PATH_DEPTH) {
        throw new Error(`Invalid folder path: exceeds maximum depth of ${MAX_PATH_DEPTH}`);
    }

    // Validate each segment
    for (const segment of segments) {
        if (!ALLOWED_FOLDER_CHARS.test(segment)) {
            throw new Error(
                `Invalid folder name "${segment}": only alphanumeric, dash, underscore, and spaces allowed`
            );
        }
    }

    // Rejoin with forward slashes
    return segments.join('/');
}

/**
 * Resolves a relative storage path to an absolute filesystem path.
 * Ensures the resolved path is within the allowed root directory.
 *
 * @param rootDir - The root storage directory (FILES_DIR)
 * @param relativePath - The relative path to resolve
 * @returns Absolute path guaranteed to be within rootDir
 * @throws Error if resolved path escapes rootDir
 */
export function resolveSecurePath(rootDir: string, relativePath: string): string {
    const normalizedRoot = path.normalize(rootDir);
    const joined = path.join(normalizedRoot, relativePath);
    const resolved = path.normalize(joined);

    // Security check: ensure resolved path starts with root
    if (!resolved.startsWith(normalizedRoot)) {
        throw new Error('Invalid path: resolved path escapes root directory');
    }

    return resolved;
}

export default {
    sanitizeFolderPath,
    resolveSecurePath,
};
