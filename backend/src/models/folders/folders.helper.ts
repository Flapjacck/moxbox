import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';
import crypto from 'crypto';

/**
 * folders.helper.ts
 * - Model helpers for CRUD operations against the `folders` table.
 * - Mirrors the pattern used in files.helper.ts for consistency.
 */

/**
 * FolderRecord
 * - Represents a folder metadata row as stored in the `folders` table.
 */
export interface FolderRecord {
    id: string;
    path: string;
    owner_id?: string | null;
    size: number; // Total size in bytes of all files in this folder
    created_at: string;
    updated_at?: string | null;
}

/**
 * nowIso()
 * - Helper that returns the current timestamp in ISO 8601 format.
 */
function nowIso() {
    return new Date().toISOString();
}

/**
 * createFolder
 * - Create and persist a folder metadata record to the `folders` table.
 * - Initializes size to 0.
 * - Returns: the created `FolderRecord` on success.
 */
export function createFolder(params: {
    path: string;
    ownerId?: string | null;
}): FolderRecord {
    const db: DatabaseType = getDatabase();
    const id = crypto.randomUUID();
    const now = nowIso();

    const stmt = db.prepare(`
        INSERT INTO folders (id, path, owner_id, size, created_at, updated_at)
        VALUES (@id, @path, @owner_id, @size, @created_at, @updated_at);
    `);

    stmt.run({
        id,
        path: params.path,
        owner_id: params.ownerId ?? null,
        size: 0,
        created_at: now,
        updated_at: null,
    });

    return getFolderById(id)!;
}

/**
 * normalizeRow
 * - Convert a raw DB row into a `FolderRecord` typed object.
 */
function normalizeRow(row: any): FolderRecord | null {
    if (!row) return null;
    return row as FolderRecord;
}

/**
 * getFolderById
 * - Find a folder by its primary `id`.
 * - Returns `null` when no folder is found.
 */
export function getFolderById(id: string): FolderRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ? LIMIT 1;');
    const row = stmt.get(id);
    return normalizeRow(row);
}

/**
 * getFolderByPath
 * - Look up a folder by its relative path.
 * - Useful for finding folder records during operations.
 */
export function getFolderByPath(path: string): FolderRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM folders WHERE path = ? LIMIT 1;');
    const row = stmt.get(path);
    return normalizeRow(row);
}

/**
 * updateFolderSize
 * - Update the cached size of a folder in the database.
 * - Also updates the `updated_at` timestamp.
 */
export function updateFolderSize(folderId: string, newSize: number): FolderRecord | null {
    const db = getDatabase();
    const now = nowIso();

    const stmt = db.prepare(`
        UPDATE folders SET size = @size, updated_at = @updated_at
        WHERE id = @id;
    `);

    stmt.run({
        id: folderId,
        size: Math.max(0, newSize), // Ensure size never goes negative
        updated_at: now,
    });

    return getFolderById(folderId);
}

/**
 * deleteFolder
 * - Delete a folder record from the database.
 * - Note: Should only be called after verifying the folder is empty on disk.
 */
export function deleteFolder(folderId: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?;');
    stmt.run(folderId);
}

/**
 * deleteFolderByPath
 * - Delete a folder record by its path.
 */
export function deleteFolderByPath(path: string): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM folders WHERE path = ?;');
    stmt.run(path);
}

/**
 * listFolders
 * - List folders with optional filters.
 * - Useful for debugging or administrative queries.
 */
export function listFolders(options?: {
    ownerId?: string;
    limit?: number;
    offset?: number;
}): FolderRecord[] {
    const db = getDatabase();
    let sql = 'SELECT * FROM folders';
    const params: any[] = [];

    if (options?.ownerId) {
        sql += ' WHERE owner_id = ?';
        params.push(options.ownerId);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
    }

    if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
    }

    const stmt = db.prepare(sql + ';');
    const rows = stmt.all(...params);
    return rows.map(normalizeRow).filter((r): r is FolderRecord => r !== null);
}

export default {
    createFolder,
    getFolderById,
    getFolderByPath,
    updateFolderSize,
    deleteFolder,
    deleteFolderByPath,
    listFolders,
};
