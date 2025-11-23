import fs from 'fs/promises';
import path from 'path';
import { FILES_DIR } from '../config/env';
import { FileStorageError, FileNotFoundError } from '../middleware/errors';
import * as logger from './logger';

/**
 * fileStorage utility
 * - Manages file operations in the configured FILES_DIR
 * - Provides methods for listing, retrieving, and deleting files
 * - Uses flat directory structure (no subdirectories)
 * 
 * @todo Add file metadata storage
 * @todo Add file ownership tracking for permission checks
 * @todo Add support for organizing files in subdirectories
 */

/**
 * Get the full filesystem path for a given filename
 * 
 * @param filename - The name of the file
 * @returns Absolute path to the file in FILES_DIR
 */
export function getFilePath(filename: string): string {
    return path.join(FILES_DIR, filename);
}

/**
 * List all files in the storage directory
 * 
 * @param filter - Optional filter object for future filtering capabilities
 * @returns Array of filenames
 * @throws {FileStorageError} If unable to read the directory
 * 
 * @todo Add pagination support (offset, limit)
 * @todo Add filtering by mimetype, size, date range, owner
 * @todo Add metadata retrieval
 * @todo Sort options
 */
export async function listFiles(filter?: { pattern?: string }): Promise<string[]> {
    try {
        const files = await fs.readdir(FILES_DIR);
        const filenames: string[] = [];

        for (const filename of files) {
            // Apply optional pattern filter
            if (filter?.pattern && !filename.includes(filter.pattern)) {
                continue;
            }

            try {
                const filePath = getFilePath(filename);
                const stats = await fs.stat(filePath);

                // Only include regular files, skip directories
                if (stats.isFile()) {
                    filenames.push(filename);
                }
            } catch (err) {
                // Skip files that can't be accessed (permissions, etc.)
                logger.error(`Unable to stat file: ${filename}`, err);
                continue;
            }
        }

        return filenames;
    } catch (err) {
        logger.error('Failed to list files from storage', err);
        throw new FileStorageError(`Failed to list files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}

/**
 * Delete a file from storage
 * 
 * @param filename - The name of the file to delete
 * @throws {FileNotFoundError} If the file does not exist
 * @throws {FileStorageError} If unable to delete the file
 * 
 * @todo Add authorization check
 * @todo Add soft delete option
 * @todo Add metadata cleanup when metadata storage is implemented
 */
export async function deleteFile(filename: string): Promise<void> {
    const filePath = getFilePath(filename);

    try {
        // Check if file exists before attempting deletion
        await fs.access(filePath);
    } catch {
        throw new FileNotFoundError(`File not found: ${filename}`);
    }

    try {
        await fs.unlink(filePath);
        logger.info(`File deleted successfully: ${filename}`);
    } catch (err) {
        logger.error(`Failed to delete file: ${filename}`, err);
        throw new FileStorageError(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}

export default {
    getFilePath,
    listFiles,
    deleteFile,
};