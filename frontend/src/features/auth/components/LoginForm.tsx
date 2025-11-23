import { Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../../components/Button";
import { TextInput } from "../../../components/TextInput";
import { useLoginForm } from "../hooks/useLoginForm";
import type { LoginFormProps } from "../types/auth.types";

/**
 * LoginForm Component
 * Displays a login form with email/password inputs and validation
 * Uses custom hook for form state management and validation logic
 */
export const LoginForm = ({
  onSubmit,
  onForgotPassword,
  isLoading = false,
}: LoginFormProps) => {
  // Use custom hook for form logic
  const { formData, errors, touched, updateField, handleBlur, validateForm } =
    useLoginForm();

  /**
   * Handles form submission
   * Validates all fields and calls onSubmit if valid
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate and submit if valid
    if (validateForm()) {
      onSubmit?.(formData.email, formData.password);
    }
  };

  return (
    <motion.div
      className="w-full max-w-md"
      // Fade in animation on mount
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Form container with subtle border and shadow */}
      <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-8 shadow-2xl">

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input field */}
          <TextInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? errors.email : ""}
            disabled={isLoading}
            required
            fullWidth
            icon={<Mail className="w-5 h-5" />}
          />

          {/* Password input field */}
          <TextInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : ""}
            disabled={isLoading}
            required
            fullWidth
            icon={<Lock className="w-5 h-5" />}
          />

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>

          {/* Forgot password link */}
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onForgotPassword}
            disabled={isLoading}
          >
            Forgot Password?
          </Button>
        </form>
      </div>
    </motion.div>
  );
};
