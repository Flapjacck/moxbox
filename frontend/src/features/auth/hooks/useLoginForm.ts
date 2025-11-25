import { useState } from "react";
import type {
    LoginFormData,
    LoginFormErrors,
    LoginFormTouched,
} from "../types/auth.types";
import { validateUsername, validatePassword } from "../utils/validation";

/**
 * Custom hook for managing login form state and validation
 * Handles form data, errors, touched fields, and validation logic
 */
export const useLoginForm = () => {
    // Form state management
    const [formData, setFormData] = useState<LoginFormData>({
        username: "",
        password: "",
    });

    // Error state for validation feedback
    const [errors, setErrors] = useState<LoginFormErrors>({
        username: "",
        password: "",
    });

    // Track if user has attempted to interact with fields
    const [touched, setTouched] = useState<LoginFormTouched>({
        username: false,
        password: false,
    });

    /**
     * Updates a single form field value
     */
    const updateField = (field: keyof LoginFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    /**
     * Marks a field as touched and validates it
     */
    const handleBlur = (field: keyof LoginFormData) => {
        setTouched((prev) => ({ ...prev, [field]: true }));

        // Validate on blur
        if (field === "username") {
            setErrors((prev) => ({ ...prev, username: validateUsername(formData.username) }));
        } else {
            setErrors((prev) => ({
                ...prev,
                password: validatePassword(formData.password),
            }));
        }
    };

    /**
     * Validates all form fields
     * @returns true if form is valid, false otherwise
     */
    const validateForm = (): boolean => {
        const usernameError = validateUsername(formData.username);
        const passwordError = validatePassword(formData.password);

        setErrors({
            username: usernameError,
            password: passwordError,
        });

        // Mark all fields as touched
        setTouched({ username: true, password: true });

        return !usernameError && !passwordError;
    };

    /**
     * Resets form to initial state
     */
    const resetForm = () => {
        setFormData({ username: "", password: "" });
        setErrors({ username: "", password: "" });
        setTouched({ username: false, password: false });
    };

    return {
        formData,
        errors,
        touched,
        updateField,
        handleBlur,
        validateForm,
        resetForm,
    };
};