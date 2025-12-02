import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';
import crypto from 'crypto';

/**
 * files.helper.ts
 * - Model helpers for CRUD operations against the `files` table.
 */

/**
 * FileRecord
 * - Represents a single file metadata row as stored in the `files` table.
 * - `metadata_json` is stored as raw JSON text in the DB;
 */
export interface FileRecord {
    id: string;
    original_name: string;
    stored_name: string;
    mime_type: string;
    size: number;
    hash_sha256?: string | null;
    storage_provider: string;
    storage_path: string;
    created_at: string;
    updated_at?: string | null;
    owner_id?: string | null;
    is_public?: number; // 0 or 1
    access_count?: number;
    last_accessed?: string | null;
    status?: string;
    metadata_json?: string | null;
}

/**
 * nowIso()
 * - Helper that returns the current timestamp in ISO 8601 format.
 */
function nowIso() {
    return new Date().toISOString();
}

/**
 * createFile
 * - Create and persist a file metadata record to the `files` table.
 *
 * Parameters (summary):
 * - originalName: Display filename from uploader
 * - storedName: Optional generated or provided filename/key (UUID or
 *   uuid.ext). If omitted, a UUID is used for the stored name.
 * - storagePath: Required storage location (local path or object key)
 * - metadata: Optional JSON-serializable object; stored as a string in the DB
 *
 * Returns: the created `FileRecord` (fresh read from DB) on success.
 * Side effects: Inserts into DB, may throw when DB writes fail. Caller
 * should clean up any physically stored file if an error occurs.
 */
export function createFile(params: {
    originalName: string;
    storedName?: string;
    mimeType?: string;
    size?: number;
    hashSha256?: string;
    storageProvider?: string;
    storagePath: string;
    ownerId?: string | null;
    isPublic?: boolean;
    metadata?: Record<string, unknown> | null;
}): FileRecord {
    const db: DatabaseType = getDatabase();
    const id = crypto.randomUUID();
    const storedName = params.storedName ?? id;
    const now = nowIso();

    const stmt = db.prepare(`
        INSERT INTO files (
            id, original_name, stored_name, mime_type, size,
            hash_sha256, storage_provider, storage_path, created_at,
            updated_at, owner_id, is_public, access_count, last_accessed, status, metadata_json
        ) VALUES (
            @id, @original_name, @stored_name, @mime_type, @size,
            @hash_sha256, @storage_provider, @storage_path, @created_at,
            @updated_at, @owner_id, @is_public, @access_count, @last_accessed, @status, @metadata_json
        );
    `);

    stmt.run({
        id,
        original_name: params.originalName,
        stored_name: storedName,
        mime_type: params.mimeType ?? null,
        size: params.size ?? null,
        hash_sha256: params.hashSha256 ?? null,
        storage_provider: params.storageProvider ?? 'local',
        storage_path: params.storagePath,
        created_at: now,
        updated_at: null,
        owner_id: params.ownerId ?? null,
        is_public: params.isPublic ? 1 : 0,
        access_count: 0,
        last_accessed: null,
        status: 'active',
        metadata_json: params.metadata ? JSON.stringify(params.metadata) : null,
    });

    return getFileById(id)!;
}

/**
 * normalizeRow
 * - Convert a raw DB row into a `FileRecord` typed object.
 * - Keeps `metadata_json` as a string to delegate parse responsibility to
 *   higher-level code; parsing inside the model could add unexpected
 *   performance overhead if many rows are returned.
 */
function normalizeRow(row: any): FileRecord | null {
    if (!row) return null;
    return {
        ...row,
        metadata_json: row.metadata_json ?? null,
    } as FileRecord;
}

/**
 * getFileById
 * - Find a file by its primary `id`.
 * - Returns `null` when no file is found.
 */
export function getFileById(id: string): FileRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM files WHERE id = ? LIMIT 1;');
    const row = stmt.get(id);
    return normalizeRow(row);
}

/**
 * getFileByStoredName
 * - Lookup a file by its stored filename (the filesystem filename or object
 *   key). Useful for lookups when you only have the stored name.
 */
export function getFileByStoredName(storedName: string): FileRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM files WHERE stored_name = ? LIMIT 1;');
    const row = stmt.get(storedName);
    return normalizeRow(row);
}

/**
 * getDeletedFileByOriginalNameAndFolder
 * - Find a trashed (soft-deleted) file by the display/original filename
 *   and the folder it lives in. This is used by the upload flow to detect
 *   potential conflicts where a user attempts to upload a file that already
 *   exists in the Trash. We intentionally do not check owner_id here so the
 *   behavior is solely based on filename + location.
 */
export function getDeletedFileByOriginalNameAndFolder(originalName: string, folder?: string | null): FileRecord | null {
    const db = getDatabase();
    if (!folder) {
        // Root folder: storage_path should not contain any '/'
        const stmt = db.prepare('SELECT * FROM files WHERE original_name = ? AND status = ? AND storage_path NOT LIKE ? LIMIT 1;');
        const row = stmt.get(originalName, 'deleted', '%/%');
        return normalizeRow(row);
    }

    // Folder has been provided; match storage_path prefix 'folder/%'
    const stmt = db.prepare(`SELECT * FROM files WHERE original_name = ? AND status = 'deleted' AND storage_path LIKE ? LIMIT 1;`);
    const row = stmt.get(originalName, `${folder}/%`);
    return normalizeRow(row);
}

/**
 * listFiles
 * - List files with optional filters and pagination.
 * - Supports filtering by status ('active' or 'deleted') for trash feature.
 * - Defaults to 'active' if no status is provided.
 */
export function listFiles(options?: {
    ownerId?: string;
    isPublic?: boolean;
    status?: 'active' | 'deleted';
    limit?: number;
    offset?: number;
}) {
    const db = getDatabase();
    const status = options?.status ?? 'active';
    let sql = `SELECT * FROM files WHERE status = ?`;
    const params: any[] = [status];
    if (options?.ownerId) {
        sql += ' AND owner_id = ?';
        params.push(options.ownerId);
    }
    if (options?.isPublic !== undefined) {
        sql += ' AND is_public = ?';
        params.push(options.isPublic ? 1 : 0);
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
    return rows.map(normalizeRow);
}

/**
 * updateFile
 * - Update fields on a file record.
 * - Accepts a partial `patch` of `FileRecord` fields. If `metadata_json` is
 *   provided as an object it will be stringified automatically.
 * - Returns the updated `FileRecord` or `null` if the record does not exist.
 */
export function updateFile(id: string, patch: Partial<Omit<FileRecord, 'id'>>) {
    const db = getDatabase();
    const current = getFileById(id);
    if (!current) return null;

    const updated: any = { ...current, ...patch, updated_at: nowIso() };
    if (patch.metadata_json && typeof patch.metadata_json !== 'string') {
        updated.metadata_json = JSON.stringify(patch.metadata_json);
    }

    const stmt = db.prepare(`
        UPDATE files SET
            original_name = @original_name,
            mime_type = @mime_type,
            size = @size,
            hash_sha256 = @hash_sha256,
            storage_provider = @storage_provider,
            storage_path = @storage_path,
            updated_at = @updated_at,
            owner_id = @owner_id,
            is_public = @is_public,
            access_count = @access_count,
            last_accessed = @last_accessed,
            status = @status,
            metadata_json = @metadata_json
        WHERE id = @id;
    `);

    stmt.run({
        id,
        original_name: updated.original_name,
        mime_type: updated.mime_type,
        size: updated.size,
        hash_sha256: updated.hash_sha256,
        storage_provider: updated.storage_provider,
        storage_path: updated.storage_path,
        updated_at: updated.updated_at,
        owner_id: updated.owner_id,
        is_public: updated.is_public ? 1 : 0,
        access_count: updated.access_count ?? 0,
        last_accessed: updated.last_accessed ?? null,
        status: updated.status ?? 'active',
        metadata_json: updated.metadata_json ?? null,
    });

    return getFileById(id);
}

/**
 * markFileDeleted
 * - Soft-delete a file by updating the `status` field to 'deleted'. This keeps
 *   the row for audit and allows physical cleanup later.
 */
export function markFileDeleted(id: string) {
    return updateFile(id, { status: 'deleted' });
}

/**
 * deleteFilePermanent
 * - Remove a file metadata row from the DB permanently. Returns the
 *   `storagePath` so the caller can remove the physical file. This function
 *   does not touch the file system, it only deletes the DB row.
 */
export function deleteFilePermanent(id: string): { storagePath: string | null } | null {
    const db = getDatabase();
    const file = getFileById(id);
    if (!file) return null;
    const storagePath = file.storage_path;
    const stmt = db.prepare('DELETE FROM files WHERE id = ?;');
    stmt.run(id);
    return { storagePath };
}

/**
 * bumpAccess
 * - Increment download/access count and update `last_accessed` timestamp.
 * - Useful for metrics and drive-by cleanup of stale files.
 */
export function bumpAccess(id: string) {
    const db = getDatabase();
    const file = getFileById(id);
    if (!file) return null;
    const stmt = db.prepare('UPDATE files SET access_count = access_count + 1, last_accessed = ? WHERE id = ?;');
    stmt.run(nowIso(), id);
    return getFileById(id);
}

export default {
    createFile,
    getFileById,
    getFileByStoredName,
    listFiles,
    updateFile,
    markFileDeleted,
    deleteFilePermanent,
    bumpAccess,
};
