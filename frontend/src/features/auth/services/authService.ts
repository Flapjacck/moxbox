/**
 * Auth Service
 * =============
 * API call wrappers for authentication endpoints.
 * Handles login, logout, and user session management.
 */

import { apiFetch } from '../../../api';
import type { LoginResponse, User } from '../types/auth.types';

// ============================================
// Constants
// ============================================

/** localStorage key for storing the JWT token */
export const TOKEN_STORAGE_KEY = 'auth_token';

// ============================================
// Token Management
// ============================================

/**
 * Stores the authentication token in localStorage.
 * @param token - JWT token received from login response
 */
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Retrieves the stored authentication token.
 * @returns The stored JWT token, or null if not found
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Removes the authentication token from storage.
 * Called during logout to clear the session.
 */
export const clearToken = (): void => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * Checks if a user is currently authenticated.
 * @returns True if a token exists in storage
 */
export const isAuthenticated = (): boolean => {
    return getToken() !== null;
};

// ============================================
// API Calls
// ============================================

/**
 * Authenticates a user with username and password.
 * On success, stores the JWT token and returns user data.
 *
 * @param username - The user's username
 * @param password - The user's password
 * @returns Promise resolving to LoginResponse with token and user
 * @throws Error with message from backend on authentication failure
 *
 * @example
 * try {
 *   const { token, user } = await login('admin', 'password123');
 *   console.log(`Logged in as ${user.username}`);
 * } catch (error) {
 *   console.error('Login failed:', error.message);
 * }
 */
export const login = async (
    username: string,
    password: string
): Promise<LoginResponse> => {
    const response = await apiFetch('/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    // Handle error responses (400 Bad Request, 401 Unauthorized)
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed. Please try again.');
    }

    // Parse successful response
    const data: LoginResponse = await response.json();

    // Store token for subsequent authenticated requests
    setToken(data.token);

    return data;
};

/**
 * Fetches the current authenticated user's profile.
 * Requires a valid token to be stored.
 *
 * @returns Promise resolving to the current User
 * @throws Error if not authenticated or token is invalid
 */
export const getCurrentUser = async (): Promise<User> => {
    const token = getToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await apiFetch('/users/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        // Token might be expired or invalid
        if (response.status === 401) {
            clearToken();
            throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to fetch user profile');
    }

    return response.json();
};

/**
 * Logs out the current user.
 * Clears the stored token and notifies the backend.
 *
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
    const token = getToken();

    // Always clear local token, even if backend call fails
    clearToken();

    if (token) {
        try {
            await apiFetch('/users/logout', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch {
            // Silently handle logout errors - token is already cleared
            console.warn('Backend logout failed, but local session cleared');
        }
    }
};