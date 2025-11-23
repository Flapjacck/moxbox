/**
 * Validates email format using regex pattern
 * @param email - Email string to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateEmail = (email: string): string => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address";
    }
    return "";
};

/**
 * Validates password length requirement
 * @param password - Password string to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    if (password.length < 6) {
        return "Password must be at least 6 characters";
    }
    return "";
};