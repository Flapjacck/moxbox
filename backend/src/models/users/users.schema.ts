import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';

/**
 * users.schema.ts
 * - Schema creation for the `users` table
 * - Handles table and index initialization
 *
 * NOTE: Call `initializeUsersModel()` after `initializeDatabase()` at startup
 */

export function initializeUsersModel(): void {
    const db: DatabaseType = getDatabase();

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT
        );
    `);

    // Index for username lookups during login
    db.exec(`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);`);
}

export default { initializeUsersModel };
