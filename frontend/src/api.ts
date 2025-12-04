/**
 * API Configuration Utilities
 * ============================
 * Central configuration for backend API communication.
 * Import and use in feature services (authService, fileService, etc.)
 */

/**
 * Backend server URL (without /api prefix).
 */
// Determine backend base URL.
// Priority:
// 1) VITE_BACKEND_URL env var (explicit override)
// 2) Derive from the current frontend location (same hostname) and VITE_BACKEND_PORT (defaults to 4200)
// 3) Fallback to localhost:4200 (for environments where window is not available)
// Optional flag to prefer a derived backend host built from the current frontend
// host (window.location.hostname). When `true`, the frontend will replace
// `VITE_BACKEND_URL` with a derived host so requests go back to the same host
// the frontend was accessed from — useful for multi-interface/dev setups
// (e.g., local LAN IP vs Tailscale IP).
const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
const envPort = import.meta.env.VITE_BACKEND_PORT as string | undefined;
const useDerivedHost = (import.meta.env.VITE_BACKEND_USE_DERIVED_HOST || 'false') === 'true';
const defaultPort = envPort || '4200';
const derivedUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${defaultPort}`
    : `http://localhost:${defaultPort}`;

// If the user explicitly wants a derived host, prefer that over the env URL.
// Otherwise, fall back to envUrl when defined.
export const API_BASE_URL = useDerivedHost ? derivedUrl : (envUrl || derivedUrl);

/**
 * API route prefix used by the backend.
 * Set VITE_API_PREFIX in .env to override if backend uses different prefix.
 */
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api';

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
