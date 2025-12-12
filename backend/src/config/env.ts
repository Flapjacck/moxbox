// File to manage configuration from config.json
import { readFileSync } from 'fs';
import { join } from 'path';

// Load config.json from project root (two levels up from this file)
const configPath = join(__dirname, '..', '..', '..', 'config.json');
let configData: any = {};

try {
    const configFile = readFileSync(configPath, 'utf-8');
    configData = JSON.parse(configFile);
} catch (error) {
    console.error(`[config] Failed to load config.json from ${configPath}:`, error);
    console.error('[config] Falling back to environment variables or defaults');
}

const backend = configData.backend || {};
const upload = backend.upload || {};
const cors = backend.cors || {};

// Export individual values with env var fallbacks for backwards compatibility
export const PORT = Number(process.env.PORT || backend.port) || 3000;
export const HOST = process.env.HOST || backend.host || '0.0.0.0';
export const JWT_SECRET = process.env.JWT_SECRET || backend.jwtSecret || '';
export const FILES_DIR = process.env.FILES_DIR || backend.filesDir || '/path/to/mounted/proxmox/storage';
export const DATABASE_PATH = process.env.DATABASE_PATH || backend.databasePath || './data/moxbox.db';

// CORS origins from config
export const CORS_ALLOWED_ORIGINS: string[] = cors.allowedOrigins || [];

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

// Upload configuration from config.json with env var fallback
const maxFileSizeFromConfig = upload.maxFileSize;
const maxFileSizeFromEnv = process.env.UPLOAD_MAX_FILE_SIZE;
export const UPLOAD_MAX_FILE_SIZE = parseFileSize(maxFileSizeFromEnv || maxFileSizeFromConfig);

/**
 * List of MIME types that are disallowed for upload (blacklist).
 * Reads from config.json upload.disallowedMimeTypes array, or falls back to
 * comma-separated env var, or empty list.
 */
const disallowedFromConfig: string[] = Array.isArray(upload.disallowedMimeTypes)
    ? upload.disallowedMimeTypes
    : [];
const disallowedFromEnv = process.env.UPLOAD_DISALLOWED_MIME_TYPES
    ? parseMimeTypeList(process.env.UPLOAD_DISALLOWED_MIME_TYPES)
    : [];
export const UPLOAD_DISALLOWED_MIME_TYPES: string[] =
    disallowedFromEnv.length > 0 ? disallowedFromEnv : disallowedFromConfig;

/**
 * A typed configuration object for the runtime application.
 * Keeping the individual exports for compatibility.
 */
export interface Config {
    port: number;
    host: string;
    jwtSecret: string;
    filesDir: string;
    databasePath: string;
    /** Maximum file size for uploads in bytes */
    uploadMaxFileSize: number;
    /** List of MIME types that are disallowed for upload */
    uploadDisallowedMimeTypes: string[];
    /** List of allowed CORS origins */
    corsAllowedOrigins: string[];
}

export const config: Config = {
    port: PORT,
    host: HOST,
    jwtSecret: JWT_SECRET,
    filesDir: FILES_DIR,
    databasePath: DATABASE_PATH,
    uploadMaxFileSize: UPLOAD_MAX_FILE_SIZE,
    uploadDisallowedMimeTypes: UPLOAD_DISALLOWED_MIME_TYPES,
    corsAllowedOrigins: CORS_ALLOWED_ORIGINS,
};

export default config;