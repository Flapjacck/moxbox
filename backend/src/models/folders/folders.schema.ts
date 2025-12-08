import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';

/**
 * folders.schema.ts
 * - Responsible for schema (table + indexes) creation for the `folders` table
 * - Keeps DDL separate from model helpers, following files model pattern
 *
 * NOTE: Call `initializeFoldersModel()` after `initializeDatabase()` at startup
 */

export function initializeFoldersModel(): void {
    const db: DatabaseType = getDatabase();

    db.exec(`
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL UNIQUE,
            owner_id TEXT,
            size INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT
        );
    `);

    // Indexes for common queries
    db.exec(`CREATE INDEX IF NOT EXISTS folders_owner_idx ON folders(owner_id);`);
    db.exec(`CREATE INDEX IF NOT EXISTS folders_path_idx ON folders(path);`);
}

export default { initializeFoldersModel };
