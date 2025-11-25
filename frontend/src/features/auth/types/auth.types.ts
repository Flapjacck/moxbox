// Login form types
export interface LoginFormData {
    username: string;
    password: string;
}

export interface LoginFormErrors {
    username: string;
    password: string;
}

export interface LoginFormTouched {
    username: boolean;
    password: boolean;
}

export interface LoginFormProps {
    onSubmit?: (username: string, password: string) => void;
    isLoading?: boolean;
}