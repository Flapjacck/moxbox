/**
 * API Configuration Utilities
 * ============================
 * Central configuration for backend API communication.
 * Loads configuration from config.yaml in the project root.
 * Import and use in feature services (authService, fileService, etc.)
 */

import YAML from 'js-yaml';

/** Configuration structure loaded from config.yaml */
interface AppConfig {
    server?: { host?: string; port?: number };
    backend?: { port?: number };
    frontend?: {
        port?: number;
        backendUrl?: string | null;
        useDerivedHost?: boolean;
        apiPrefix?: string;
    };
}

/**
 * Load configuration from config.yaml (processed at build time by Vite)
 * Falls back to sensible defaults if config not available
 */
async function loadConfig(): Promise<AppConfig> {
    try {
        console.log('[API] Attempting to fetch /config.yaml...')
        const response = await fetch('/config.yaml', {
            headers: { 'Accept': 'application/yaml, text/plain' },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.warn(`[API] config.yaml fetch failed with status ${response.status}`);
            return getDefaultConfig();
        }

        const text = await response.text();
        console.log('[API] Raw config.yaml text:', text.substring(0, 200));

        const config = parseYaml(text);
        console.log('[API] Loaded config from config.yaml:', config);
        return config;
    } catch (error) {
        console.warn('[API] Could not load config.yaml, using defaults:', error);
        return getDefaultConfig();
    }
}

/**
 * Parse YAML configuration using js-yaml library
 */
function parseYaml(content: string): AppConfig {
    try {
        return YAML.load(content) as AppConfig;
    } catch (error) {
        console.error('[API] YAML parse error:', error);
        return {};
    }
}

/**
 * Default configuration for fallback scenarios
 */
function getDefaultConfig(): AppConfig {
    return {
        server: { port: 4200, host: '0.0.0.0' },
        backend: { port: 4200 },
        frontend: {
            port: 5173,
            backendUrl: null,
            useDerivedHost: false,
            apiPrefix: '/api',
        },
    };
}

/**
 * Initialize API configuration from config.yaml
 * Resolves backend URL based on deployment context
 */
let configPromise: Promise<AppConfig> | null = null;
let resolvedConfig: AppConfig | null = null;

async function getResolvedConfig(): Promise<AppConfig> {
    if (resolvedConfig) return resolvedConfig;
    if (!configPromise) {
        configPromise = loadConfig();
    }
    resolvedConfig = await configPromise;
    return resolvedConfig;
}

/**
 * Determine backend URL based on config and deployment context
 */
function resolveBackendUrl(config: AppConfig): string {
    const fe = config.frontend || {};
    const backend = config.backend || {};
    const server = config.server || {};
    const backendPort = backend.port || 4200;
    const serverHost = server.host || '0.0.0.0';

    console.log('[API] resolveBackendUrl - config:', { fe, backend, backendPort, serverHost });

    // Priority:
    // 1. Use derived host if enabled (auto-detect from window.location)
    if (fe.useDerivedHost && typeof window !== 'undefined') {
        const url = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
        console.log('[API] Using derived host:', url);
        return url;
    }

    // 2. Use explicit backendUrl if configured
    if (fe.backendUrl) {
        console.log('[API] Using explicit backendUrl:', fe.backendUrl);
        return fe.backendUrl;
    }

    // 3. Fallback: derive from current location or use localhost
    if (typeof window !== 'undefined') {
        const url = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
        console.log('[API] Using window.location derived host:', url);
        return url;
    }
    const url = `http://localhost:${backendPort}`;
    console.log('[API] Using localhost fallback:', url);
    return url;
}

/**
 * Backend server URL (without /api prefix)
 */
export let API_BASE_URL: string = 'http://localhost:4200';

/**
 * API route prefix used by the backend
 */
export let API_PREFIX: string = '/api';

/**
 * Initialize API configuration (call this on app startup)
 */
export async function initializeApiConfig(): Promise<void> {
    const config = await getResolvedConfig();
    console.log('[API] Resolved config:', config);
    API_BASE_URL = resolveBackendUrl(config).replace(/\/+$/, '');
    API_PREFIX = config.frontend?.apiPrefix || '/api';
    console.log(
        `[API] Configured: BASE_URL=${API_BASE_URL}, PREFIX=${API_PREFIX}`
    );
}

/**
 * Builds a complete API URL from an endpoint path
 *
 * @param endpoint - The API endpoint (e.g., '/users/me' or 'files')
 * @returns Complete URL (e.g., 'http://localhost:4200/api/users/me')
 */
export const getApiUrl = (endpoint: string): string => {
    // If endpoint is already a full URL, return as-is
    if (endpoint.startsWith('http')) {
        return endpoint;
    }

    // If endpoint already includes api prefix, don't add it again
    if (endpoint.startsWith(API_PREFIX)) {
        return `${API_BASE_URL}${endpoint}`;
    }

    // Add api prefix to endpoint (handle leading slash)
    return `${API_BASE_URL}${API_PREFIX}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

/**
 * Base fetch function that uses the API URL builder
 * Services can use this directly or wrap it with additional logic
 *
 * @param endpoint - The API endpoint path
 * @param options - Standard fetch RequestInit options
 * @returns Promise resolving to the fetch Response
 */
export const apiFetch = (
    endpoint: string,
    options?: RequestInit
): Promise<Response> => {
    return fetch(getApiUrl(endpoint), options);
};
