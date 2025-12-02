import fs from 'fs/promises';
import path from 'path';
import { FILES_DIR } from '../config/env';
import { FileStorageError, FileNotFoundError } from '../middleware/errors';
import * as logger from './logger';
import { resolveSecurePath } from './pathSanitizer';

/**
 * fileStorage utility
 * - Manages file operations in the configured FILES_DIR
 * - Provides methods for listing, retrieving, and deleting files
 * - Supports subdirectories within FILES_DIR
 */

/**
 * Get the full filesystem path for a given relative storage path.
 * Supports both flat filenames and paths with subdirectories.
 * 
 * @param storagePath - Relative path (e.g., "file.txt" or "folder/file.txt")
 * @returns Absolute path within FILES_DIR
 * @throws Error if path escapes FILES_DIR
 */
export function getFilePath(storagePath: string): string {
    return resolveSecurePath(FILES_DIR, storagePath);
}

/**
 * Ensure a directory exists within FILES_DIR.
 * Creates the directory recursively if it doesn't exist.
 *
 * @param folder - Relative folder path within FILES_DIR
 * @throws {FileStorageError} If unable to create directory
 */
export async function ensureDirectory(folder: string): Promise<string> {
    const dirPath = resolveSecurePath(FILES_DIR, folder);
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return dirPath;
    } catch (err) {
        logger.error(`Failed to create directory: ${folder}`, err);
        throw new FileStorageError(
            `Failed to create directory: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
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
 * Delete a file from storage by its relative storage path.
 * 
 * @param storagePath - Relative path to the file (e.g., "folder/file.txt")
 * @throws {FileNotFoundError} If the file does not exist
 * @throws {FileStorageError} If unable to delete the file
 */
export async function deleteFile(storagePath: string): Promise<void> {
    const filePath = getFilePath(storagePath);

    try {
        // Check if file exists before attempting deletion
        await fs.access(filePath);
    } catch {
        throw new FileNotFoundError(`File not found: ${storagePath}`);
    }

    try {
        await fs.unlink(filePath);
    } catch (err) {
        logger.error(`Failed to delete file: ${storagePath}`, err);
        throw new FileStorageError(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}

/**
 * Rename (move) a folder within FILES_DIR.
 *
 * @param oldPath - Current relative folder path
 * @param newPath - New relative folder path
 * @throws {FileNotFoundError} If old folder does not exist
 * @throws {FileStorageError} If rename fails
 */
export async function renameFolder(oldPath: string, newPath: string): Promise<void> {
    const oldAbs = resolveSecurePath(FILES_DIR, oldPath);
    const newAbs = resolveSecurePath(FILES_DIR, newPath);

    try {
        await fs.access(oldAbs);
    } catch {
        throw new FileNotFoundError(`Folder not found: ${oldPath}`);
    }

    try {
        await fs.rename(oldAbs, newAbs);
    } catch (err) {
        logger.error(`Failed to rename folder: ${oldPath} -> ${newPath}`, err);
        throw new FileStorageError(
            `Failed to rename folder: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
}

/**
 * Delete an empty folder within FILES_DIR.
 *
 * @param folderPath - Relative folder path to delete
 * @throws {FileNotFoundError} If folder does not exist
 * @throws {FileStorageError} If deletion fails (e.g., not empty)
 */
export async function deleteFolder(folderPath: string): Promise<void> {
    const absPath = resolveSecurePath(FILES_DIR, folderPath);

    try {
        await fs.access(absPath);
    } catch {
        throw new FileNotFoundError(`Folder not found: ${folderPath}`);
    }

    try {
        await fs.rmdir(absPath);
    } catch (err) {
        logger.error(`Failed to delete folder: ${folderPath}`, err);
        throw new FileStorageError(
            `Failed to delete folder: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
}

/** Represents an entry in a directory listing */
export interface DirectoryEntry {
    name: string;
    type: 'file' | 'folder';
    size?: number;
}

/**
 * List contents (files and folders) of a directory within FILES_DIR.
 *
 * @param folderPath - Relative folder path (empty string = root)
 * @returns Array of directory entries with name and type
 * @throws {FileStorageError} If unable to read the directory
 */
export async function listDirectoryContents(folderPath: string): Promise<DirectoryEntry[]> {
    const absPath = folderPath ? resolveSecurePath(FILES_DIR, folderPath) : FILES_DIR;

    try {
        const entries = await fs.readdir(absPath, { withFileTypes: true });
        const results: DirectoryEntry[] = [];

        for (const entry of entries) {
            if (entry.isFile()) {
                const filePath = path.join(absPath, entry.name);
                const stats = await fs.stat(filePath);
                results.push({ name: entry.name, type: 'file', size: stats.size });
            } else if (entry.isDirectory()) {
                results.push({ name: entry.name, type: 'folder' });
            }
        }

        return results;
    } catch (err) {
        logger.error(`Failed to list directory contents: ${folderPath}`, err);
        throw new FileStorageError(
            `Failed to list directory: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
    }
}

export default {
    getFilePath,
    ensureDirectory,
    listFiles,
    deleteFile,
    renameFolder,
    deleteFolder,
    listDirectoryContents,
};