/**
 * Validates username presence
 * @param username - Username string to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateUsername = (username: string): string => {
    if (!username) return "Username is required";
    return "";
};

/**
 * Validates password presence (no length restrictions)
 * @param password - Password string to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validatePassword = (password: string): string => {
    if (!password) return "Password is required";
    return "";
};