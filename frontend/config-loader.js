/**
 * Config loader for Vite build - reads config.yaml at build time
 * Used by vite.config.ts to configure the dev server
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadConfig() {
    const configPath = path.resolve(__dirname, '../config.yaml');

    const defaults = {
        server: { host: '0.0.0.0' },
        frontend: { port: 5173 },
    };

    if (!fs.existsSync(configPath)) {
        console.warn('[CONFIG] config.yaml not found, using defaults');
        return defaults;
    }

    try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = yaml.load(fileContent) || defaults;
        return config;
    } catch (error) {
        console.error('[CONFIG] Error loading config.yaml:', error);
        return defaults;
    }
}
