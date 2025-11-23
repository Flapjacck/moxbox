// Login form types
export interface LoginFormData {
    email: string;
    password: string;
}

export interface LoginFormErrors {
    email: string;
    password: string;
}

export interface LoginFormTouched {
    email: boolean;
    password: boolean;
}

export interface LoginFormProps {
    onSubmit?: (email: string, password: string) => void;
    onForgotPassword?: () => void;
    isLoading?: boolean;
}