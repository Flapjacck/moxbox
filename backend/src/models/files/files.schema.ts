import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';

/**
 * files.schema.ts
 * - Responsible for schema (table + index) creation for the `files` table
 * - Keeps DDL separate from model helpers
 *
 * NOTE: Call `initializeFilesModel()` after `initializeDatabase()` at startup
 */

export function initializeFilesModel(): void {
    const db: DatabaseType = getDatabase();

    db.exec(`
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL UNIQUE,
            mime_type TEXT,
            size INTEGER,
            hash_sha256 TEXT,
            storage_provider TEXT NOT NULL DEFAULT 'local',
            storage_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT,
            owner_id TEXT,
            is_public INTEGER NOT NULL DEFAULT 0,
            access_count INTEGER NOT NULL DEFAULT 0,
            last_accessed TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            metadata_json TEXT
        );
    `);

    // Suggested indexes for common queries
    db.exec(`CREATE INDEX IF NOT EXISTS files_owner_idx ON files(owner_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS files_created_idx ON files(created_at);`);
    db.exec(`CREATE INDEX IF NOT EXISTS files_hash_idx ON files(hash_sha256);`);
}

export default { initializeFilesModel };
