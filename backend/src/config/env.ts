import fs from "fs";
import path from "path";
import yaml from "js-yaml";

/**
 * Configuration interface - defines all app settings
 */
export interface Config {
    port: number;
    host: string;
    jwtSecret: string;
    filesDir: string;
    databasePath: string;
    uploadMaxFileSize: number; // in bytes
    uploadDisallowedMimeTypes: string[];
    corsAllowedOrigins: string[];
    nodeEnv: string;
}

/**
 * Parse size strings (e.g., "1gb", "500MB", "100kb") to bytes
 */
function parseSizeToBytes(size: string): number {
    const units: Record<string, number> = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
        tb: 1024 * 1024 * 1024 * 1024,
    };

    const match = size.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/i);
    if (!match) {
        throw new Error(`Invalid size format: "${size}". Use format like "1gb", "500MB", "100kb"`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || "b").toLowerCase();

    if (!(unit in units)) {
        throw new Error(`Unknown unit: "${unit}". Supported: b, kb, mb, gb, tb`);
    }

    return Math.round(value * units[unit]);
}

/**
 * Parse CORS origins from config string (comma-separated)
 * Auto-derives from server host/frontend port if empty
 */
function parseCorsOrigins(originsStr: string, serverHost: string, frontendPort: number): string[] {
    if (!originsStr || originsStr.trim() === "") {
        // Auto-derive: if binding to 0.0.0.0, default to localhost + frontend port
        const effectiveHost = serverHost === "0.0.0.0" ? "localhost" : serverHost;
        return [`http://${effectiveHost}:${frontendPort}`];
    }

    return originsStr
        .split(",")
        .map((origin) => {
            const trimmed = origin.trim();
            // Remove trailing slashes for consistency
            return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
        })
        .filter((origin) => origin.length > 0);
}

/**
 * Load and parse configuration from config.yaml
 * Falls back to sensible defaults if config file missing
 */
function loadConfig(): Config {
    const configPath = path.resolve(__dirname, "../../../config.yaml");

    let rawConfig: any = {
        server: {},
        backend: {},
        frontend: {},
    };

    if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, "utf-8");
        rawConfig = yaml.load(fileContent) || rawConfig;
    } else {
        console.warn(`[CONFIG] config.yaml not found at ${configPath}, using defaults`);
    }

    // Extract values with defaults
    const server = rawConfig.server || {};
    const backend = rawConfig.backend || {};
    const frontend = rawConfig.frontend || {};

    const port = backend.port ?? 4200;
    const host = server.host ?? "0.0.0.0";
    const nodeEnv = rawConfig.nodeEnv ?? "production";

    // Validate required secrets
    const jwtSecret = backend.jwtSecret;
    if (!jwtSecret || jwtSecret.includes("change-me")) {
        console.warn(
            "[CONFIG] WARNING: jwtSecret not set or using default value. Set a strong secret in config.yaml for production."
        );
    }

    const filesDir = backend.filesDir ?? "./files";
    const databasePath = backend.databasePath ?? "./backend/database.sqlite";

    // Parse upload max file size
    let uploadMaxFileSize = 1024 * 1024 * 1024; // 1GB default
    if (backend.uploadMaxFileSize) {
        try {
            uploadMaxFileSize = parseSizeToBytes(backend.uploadMaxFileSize);
        } catch (error) {
            console.error(`[CONFIG] Error parsing uploadMaxFileSize:`, error);
            throw error;
        }
    }

    // Parse disallowed MIME types
    const uploadDisallowedMimeTypes = Array.isArray(backend.uploadDisallowedMimeTypes)
        ? backend.uploadDisallowedMimeTypes
        : backend.uploadDisallowedMimeTypes
            ? backend.uploadDisallowedMimeTypes.split(",").map((m: string) => m.trim())
            : [];

    // Parse CORS origins using frontend port
    const corsOriginsStr = rawConfig.corsAllowedOrigins || "";
    const frontendPort = frontend.port ?? 5173;
    const corsAllowedOrigins = parseCorsOrigins(corsOriginsStr, host, frontendPort);

    return {
        port,
        host,
        jwtSecret: jwtSecret || "default-secret-change-in-production",
        filesDir,
        databasePath,
        uploadMaxFileSize,
        uploadDisallowedMimeTypes,
        corsAllowedOrigins,
        nodeEnv,
    };
}

/**
 * Global config instance
 */
export const config = loadConfig();

// Export individual values for backward compatibility
export const PORT = config.port;
export const HOST = config.host;
export const JWT_SECRET = config.jwtSecret;
export const FILES_DIR = config.filesDir;
export const DATABASE_PATH = config.databasePath;
export const UPLOAD_MAX_FILE_SIZE = config.uploadMaxFileSize;
export const UPLOAD_DISALLOWED_MIME_TYPES = config.uploadDisallowedMimeTypes;
export const CORS_ALLOWED_ORIGINS = config.corsAllowedOrigins;
export const NODE_ENV = config.nodeEnv;

export default config;