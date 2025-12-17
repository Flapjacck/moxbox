/**
 * API Configuration Utilities
 * ============================
 * Central configuration for backend API communication.
 * Import and use in feature services (authService, fileService, etc.)
 */

// Declare injected constants from vite.config.ts
declare const __CONFIG_BACKEND_URL__: string;
declare const __CONFIG_API_PREFIX__: string;

/**
 * Backend server URL (without /api prefix).
 * Loaded from config.json at build time via Vite.
 * 
 * Priority:
 * 1) config.json frontend.backendUrl (injected at build time)
 * 2) VITE_BACKEND_URL env var (explicit override)
 * 3) VITE_BACKEND_USE_DERIVED_HOST (derive from current hostname)
 * 4) Fallback to localhost:4200
 */
const configUrl = typeof __CONFIG_BACKEND_URL__ !== 'undefined' ? __CONFIG_BACKEND_URL__ : undefined;
const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
const envPort = import.meta.env.VITE_BACKEND_PORT as string | undefined;
const useDerivedHost = (import.meta.env.VITE_BACKEND_USE_DERIVED_HOST || 'false') === 'true';
const defaultPort = envPort || '4200';
const derivedUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${defaultPort}`
    : `http://localhost:${defaultPort}`;

// Priority: env override > derived host > config.json > derived fallback
export const API_BASE_URL = envUrl || (useDerivedHost ? derivedUrl : (configUrl || derivedUrl));

/**
 * API route prefix used by the backend.
 * Loaded from config.json at build time, with env var fallback.
 */
const configPrefix = typeof __CONFIG_API_PREFIX__ !== 'undefined' ? __CONFIG_API_PREFIX__ : undefined;
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || configPrefix || '/api';

/**
 * Builds a complete API URL from an endpoint path.
 *
 * @param endpoint - The API endpoint (e.g., '/users/me' or 'files')
 * @returns Complete URL (e.g., 'http://localhost:4200/api/users/me')
 *
 * @example
 * getApiUrl('/users/login')  // → 'http://localhost:4200/api/users/login'
 * getApiUrl('files')         // → 'http://localhost:4200/api/files'
 * getApiUrl('/api/health')   // → 'http://localhost:4200/api/health' (no double prefix)
 * getApiUrl('http://...')    // → 'http://...' (returned as-is)
 */
// Normalize base url to avoid duplicate slashes if env contains trailing '/'
const normalizedBase = API_BASE_URL.replace(/\/+$|(\/)+$/g, '');

export const getApiUrl = (endpoint: string): string => {
    // If endpoint is already a full URL, return as-is
    if (endpoint.startsWith('http')) {
        return endpoint;
    }

    // If endpoint already includes api prefix, don't add it again
    if (endpoint.startsWith(API_PREFIX)) {
        return `${normalizedBase}${endpoint}`;
    }

    // Add api prefix to endpoint (handle leading slash)
    return `${normalizedBase}${API_PREFIX}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

/**
 * Base fetch function that uses the API URL builder.
 * Services can use this directly or wrap it with additional logic.
 *
 * @param endpoint - The API endpoint path
 * @param options - Standard fetch RequestInit options
 * @returns Promise resolving to the fetch Response
 *
 * @example
 * // Simple GET request
 * const response = await apiFetch('/users/me');
 *
 * @example
 * // POST request with JSON body
 * const response = await apiFetch('/users/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ username, password }),
 * });
 */
export const apiFetch = (
    endpoint: string,
    options?: RequestInit
): Promise<Response> => {
    return fetch(getApiUrl(endpoint), options);
};
