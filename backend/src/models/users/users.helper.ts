import { Database as DatabaseType } from 'better-sqlite3';
import { getDatabase } from '../../config/db';
import crypto from 'crypto';

/**
 * users.helper.ts
 * - CRUD operations for the `users` table
 * - Follows the pattern established by files.helper.ts and folders.helper.ts
 */

export interface UserRecord {
    id: string;
    username: string;
    password_hash: string;
    is_admin: number;
    created_at: string;
    updated_at?: string | null;
}

function nowIso() {
    return new Date().toISOString();
}

export function createUser(params: {
    username: string;
    passwordHash: string;
    isAdmin?: boolean;
}): UserRecord {
    const db: DatabaseType = getDatabase();
    const id = crypto.randomUUID();
    const now = nowIso();

    const stmt = db.prepare(`
        INSERT INTO users (id, username, password_hash, is_admin, created_at)
        VALUES (@id, @username, @password_hash, @is_admin, @created_at);
    `);

    stmt.run({
        id,
        username: params.username,
        password_hash: params.passwordHash,
        is_admin: params.isAdmin ? 1 : 0,
        created_at: now,
    });

    return getUserById(id)!;
}

function normalizeRow(row: any): UserRecord | null {
    if (!row) return null;
    return row as UserRecord;
}

export function getUserById(id: string): UserRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1;');
    const row = stmt.get(id);
    return normalizeRow(row);
}

export function getUserByUsername(username: string): UserRecord | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? LIMIT 1;');
    const row = stmt.get(username);
    return normalizeRow(row);
}

export function updatePassword(userId: string, newPasswordHash: string): UserRecord | null {
    const db = getDatabase();
    const now = nowIso();

    const stmt = db.prepare(`
        UPDATE users SET password_hash = @password_hash, updated_at = @updated_at
        WHERE id = @id;
    `);

    stmt.run({
        id: userId,
        password_hash: newPasswordHash,
        updated_at: now,
    });

    return getUserById(userId);
}

export function listUsers(): UserRecord[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at ASC;');
    return stmt.all() as UserRecord[];
}

export default {
    createUser,
    getUserById,
    getUserByUsername,
    updatePassword,
    listUsers,
};
