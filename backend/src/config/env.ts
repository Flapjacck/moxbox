// File to manage environment variables and configurations
import path from 'path';
import dotenv from 'dotenv';

// Prefer repository root .env (repoRoot/.env) if present. This allows a single config
// file at the repo root that controls both backend and frontend behavior. If the root
// file is not present, fall back to the default behavior of loading local backend/.env
const rootEnvPath = path.resolve(__dirname, '..', '..', '..', '.env');
dotenv.config({ path: rootEnvPath });
// Fallback to local backend/.env if values are missing
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
export const FILES_DIR = process.env.FILES_DIR || '/path/to/mounted/proxmox/storage';
export const DATABASE_PATH = process.env.DATABASE_PATH || './data/moxbox.db';
export const FRONTEND_URL = process.env.FRONTEND_URL || '';
export const FRONTEND_ALLOWED_ORIGINS = process.env.FRONTEND_ALLOWED_ORIGINS || '';

/**
 * Parse a human-readable file size string into bytes.
 * Supports formats like: "1gb", "500MB", "100kb", "1024b", "1024" (bytes)
 */
function parseFileSize(sizeStr: string | undefined): number {
    // Default: 100MB
    const DEFAULT_SIZE = 100 * 1024 * 1024;

    if (!sizeStr || typeof sizeStr !== 'string') {
        return DEFAULT_SIZE;
    }

    // Normalize: trim whitespace and convert to lowercase
    const normalized = sizeStr.trim().toLowerCase();

    if (!normalized) {
        return DEFAULT_SIZE;
    }

    // Regex to match number + optional unit (b, kb, mb, gb, tb)
    // Groups: (1) number (int or float), (2) unit suffix
    const match = normalized.match(/^([\d.]+)\s*(b|kb|mb|gb|tb)?$/i);

    if (!match) {
        console.warn(`[env] Invalid UPLOAD_MAX_FILE_SIZE format: "${sizeStr}". Using default 100MB.`);
        return DEFAULT_SIZE;
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b'; // Default to bytes if no unit

    if (isNaN(value) || value < 0) {
        console.warn(`[env] Invalid UPLOAD_MAX_FILE_SIZE value: "${sizeStr}". Using default 100MB.`);
        return DEFAULT_SIZE;
    }

    // Convert to bytes based on unit (using binary units: 1KB = 1024 bytes)
    const unitMultipliers: Record<string, number> = {
        b: 1,
        kb: 1024,
        mb: 1024 ** 2,
        gb: 1024 ** 3,
        tb: 1024 ** 4,
    };

    const multiplier = unitMultipliers[unit] ?? 1;
    return Math.floor(value * multiplier);
}

/**
 * Parse a comma-separated list of MIME types into an array.
 * Trims whitespace from each entry and filters out empty strings.
 */
function parseMimeTypeList(mimeStr: string | undefined): string[] {
    if (!mimeStr || typeof mimeStr !== 'string') {
        return [];
    }

    return mimeStr
        .split(',')
        .map((mime) => mime.trim().toLowerCase())
        .filter((mime) => mime.length > 0);
}

export const UPLOAD_MAX_FILE_SIZE = parseFileSize(process.env.UPLOAD_MAX_FILE_SIZE);

/**
 * List of MIME types that are disallowed for upload (blacklist).
 * Parsed from `UPLOAD_DISALLOWED_MIME_TYPES` env var (comma-separated).
 * Falls back to an empty list if not set
 */
export const UPLOAD_DISALLOWED_MIME_TYPES: string[] = process.env.UPLOAD_DISALLOWED_MIME_TYPES
    ? parseMimeTypeList(process.env.UPLOAD_DISALLOWED_MIME_TYPES)
    : [];

/**
 * A typed configuration object for the runtime application.
 * Keeping the individual exports for compatibility while adding a `config` export.
 */
export interface Config {
    port: number;
    host: string;
    jwtSecret: string;
    adminUser: string;
    adminPasswordHash: string;
    filesDir: string;
    databasePath: string;
    /** Maximum file size for uploads in bytes */
    uploadMaxFileSize: number;
    /** List of MIME types that are disallowed for upload */
    uploadDisallowedMimeTypes: string[];
    frontendUrl: string;
    frontendAllowedOrigins: string[];
}

export const config: Config = {
    port: PORT,
    host: HOST,
    jwtSecret: JWT_SECRET,
    adminUser: ADMIN_USERNAME,
    adminPasswordHash: ADMIN_PASSWORD_HASH,
    filesDir: FILES_DIR,
    databasePath: DATABASE_PATH,
    uploadMaxFileSize: UPLOAD_MAX_FILE_SIZE,
    uploadDisallowedMimeTypes: UPLOAD_DISALLOWED_MIME_TYPES,
    frontendUrl: FRONTEND_URL,
    frontendAllowedOrigins: FRONTEND_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
};

export default config;