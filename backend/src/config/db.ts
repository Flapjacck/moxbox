/**
 * SQLite Database Configuration and Initialization
 *
 * This module handles the SQLite database connection using better-sqlite3.
 * It creates the database file and parent directories if they don't exist,
 * and provides a singleton database instance for use throughout the application.
 *
 * Usage:
 *   import { initializeDatabase, getDatabase } from './config/db';
 *
 *   // During server startup:
 *   await initializeDatabase();
 *
 *   // In controllers/services:
 *   const db = getDatabase();
 *   const rows = db.prepare('SELECT * FROM users').all();
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DATABASE_PATH } from './env';
import { info, error } from '../utils/logger';

/** Singleton database instance — initialized once during server startup. */
let db: DatabaseType | null = null;

/**
 * Initialize the SQLite database connection.
 *
 * This function:
 * 1. Resolves the database path from environment configuration
 * 2. Creates the parent directory if it doesn't exist
 * 3. Opens (or creates) the SQLite database file
 * 4. Enables WAL mode for better concurrent read performance
 *
 * Should be called once during server startup before handling requests.
 *
 * @throws Error if database initialization fails
 */
export function initializeDatabase(): void {
    if (db) {
        info('Database already initialized, skipping...');
        return;
    }

    try {
        // Resolve the absolute path for the database file
        const dbPath = path.resolve(DATABASE_PATH);
        const dbDir = path.dirname(dbPath);

        // Ensure the directory exists (creates recursively like mkdir -p)
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            info(`Created database directory: ${dbDir}`);
        }

        // Open the database (creates the file if it doesn't exist)
        db = new Database(dbPath);

        // Enable Write-Ahead Logging for better performance with concurrent reads
        // WAL mode allows readers and writers to operate simultaneously
        db.pragma('journal_mode = WAL');

        info(`Database initialized successfully at: ${dbPath}`);
    } catch (err) {
        error('Failed to initialize database', err);
        throw err;
    }
}

/**
 * Get the database instance.
 *
 * Returns the singleton database connection. Throws if called before
 * `initializeDatabase()` — ensures the database is properly set up
 * before any queries are attempted.
 *
 * @returns The better-sqlite3 Database instance
 * @throws Error if database has not been initialized
 */
export function getDatabase(): DatabaseType {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Close the database connection gracefully.
 *
 * Should be called during server shutdown to ensure all pending
 * transactions are completed and the database file is properly closed.
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        info('Database connection closed');
    }
}

export default { initializeDatabase, getDatabase, closeDatabase };
