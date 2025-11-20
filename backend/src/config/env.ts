// File to manage environment variables and configurations
import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
export const FILES_DIR = process.env.FILES_DIR || '/path/to/mounted/proxmox/storage';

/**
 * A typed configuration object for the runtime application.
 * Keeping the individual exports for compatibility while adding a `config` export.
 */
export interface Config {
    port: number;
    jwtSecret: string;
    adminUser: string;
    adminPasswordHash: string;
    filesDir: string;
}

export const config: Config = {
    port: PORT,
    jwtSecret: JWT_SECRET,
    adminUser: ADMIN_USERNAME,
    adminPasswordHash: ADMIN_PASSWORD_HASH,
    filesDir: FILES_DIR,
};

export default config;