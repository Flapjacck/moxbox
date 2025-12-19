/**
 * API Configuration Utilities
 * ============================
 * Central configuration for backend API communication.
 * Import and use in feature services (authService, fileService, etc.)
 */

/**
 * Backend server URL construction
 * ===============================
 * Frontend automatically derives the backend URL from window.location.hostname
 * and the port specified in VITE_BACKEND_PORT env var (default: 4200).
 * 
 * This allows seamless routing from any address:
 * - localhost:5173 → backend at localhost:4200
 * - 192.168.x.x:5173 → backend at 192.168.x.x:4200
 * - tailscale-ip:5173 → backend at tailscale-ip:4200
 */
const envPort = import.meta.env.VITE_BACKEND_PORT as string | undefined;
const backendPort = envPort || '4200';
const backendUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${backendPort}`
    : `http://localhost:${backendPort}`;

export const API_BASE_URL = backendUrl;

/**
 * API route prefix
 */
export const API_PREFIX = '/api';

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
