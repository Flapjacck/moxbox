/**
 * API Helpers
 * ============
 * Centralized utilities for authenticated API requests.
 * Provides consistent error handling, token management, and typed errors.
 */

import { getToken, clearToken } from '../features/auth/services/authService';

// ============================================
// Types
// ============================================

/**
 * Extended Error with API-specific metadata.
 * - status: HTTP status code
 * - payload: Parsed JSON body (for 409 conflicts, validation errors, etc.)
 */
export type ApiError = Error & {
    status?: number;
    payload?: Record<string, unknown>;
};

/**
 * Type guard to check if an error is an ApiError.
 */
export const isApiError = (err: unknown): err is ApiError => {
    return (
        typeof err === 'object' &&
        err !== null &&
        'status' in (err as Record<string, unknown>)
    );
};

// ============================================
// Header Utilities
// ============================================

/**
 * Builds authorization headers using the current auth token.
 * @throws Error if no token is available (user not logged in)
 */
export const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated. Please log in.');
    }
    return { Authorization: `Bearer ${token}` };
};

/**
 * Builds authorization headers with JSON content type.
 * Use for POST/PATCH/DELETE requests with JSON body.
 */
export const getAuthJsonHeaders = (): HeadersInit => {
    return {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
    };
};

// ============================================
// Error Handling
// ============================================

/**
 * Parses a failed Response into a typed ApiError.
 * - Clears token on 401 (session expired)
 * - Preserves status and payload for caller handling (e.g., 409 conflicts)
 */
export const parseApiError = async (response: Response): Promise<ApiError> => {
    // Handle session expiry
    if (response.status === 401) {
        clearToken();
        const err = new Error('Session expired. Please log in again.') as ApiError;
        err.status = 401;
        return err;
    }

    // Parse error body
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || 'Request failed. Please try again.';

    const err = new Error(message) as ApiError;
    err.status = response.status;
    err.payload = errorData;

    return err;
};

/**
 * Handles API error responses by throwing a typed ApiError.
 * Convenience wrapper for use in service functions.
 * @throws ApiError - Always throws
 */
export const handleErrorResponse = async (response: Response): Promise<never> => {
    throw await parseApiError(response);
};

// ============================================
// Error Message Extraction
// ============================================

/**
 * Extracts a user-friendly message from an unknown error.
 * @param err - The caught error (could be ApiError, Error, or unknown)
 * @param fallback - Default message if extraction fails
 */
export const getErrorMessage = (err: unknown, fallback = 'An error occurred'): string => {
    if (err instanceof Error) {
        return err.message;
    }
    return fallback;
};
