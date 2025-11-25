// ============================================
// API Response Types
// ============================================

/**
 * User object returned from the backend after authentication.
 * Represents the authenticated user's identity and permissions.
 */
export interface User {
    id: string;
    username: string;
    role: string;
}

/**
 * Successful login response from POST /api/users/login.
 * Contains JWT token for subsequent authenticated requests.
 */
export interface LoginResponse {
    token: string;
    user: User;
}

/**
 * Error response structure from auth endpoints.
 * Backend returns this shape for 400/401 responses.
 */
export interface AuthError {
    message: string;
    details?: unknown;
}

// ============================================
// Form State Types
// ============================================

/**
 * Login form field values.
 */
export interface LoginFormData {
    username: string;
    password: string;
}

/**
 * Validation error messages for login form fields.
 * Empty string indicates no error.
 */
export interface LoginFormErrors {
    username: string;
    password: string;
}

/**
 * Tracks which form fields have been interacted with.
 * Used to show validation errors only after user interaction.
 */
export interface LoginFormTouched {
    username: boolean;
    password: boolean;
}

/**
 * Props for the LoginForm component.
 */
export interface LoginFormProps {
    onSubmit?: (username: string, password: string) => void;
    isLoading?: boolean;
}