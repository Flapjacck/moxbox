/**
 * API Configuration Utilities
 * ============================
 * Central configuration for backend API communication.
 * Import and use in feature services (authService, fileService, etc.)
 */

/**
 * Backend server URL (without /api prefix).
 */
export const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || 'http://localhost:4200';

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
