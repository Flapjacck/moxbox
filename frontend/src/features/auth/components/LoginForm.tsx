import { Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../../components/Button";
import { TextInput } from "../../../components/TextInput";
import { useLoginForm } from "../hooks/useLoginForm";
import type { LoginFormProps } from "../types/auth.types";

/**
 * LoginForm Component
 * Displays a login form with username/password inputs and validation
 * Uses custom hook for form state management and validation logic
 */
export const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
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
      onSubmit?.(formData.username, formData.password);
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
          {/* Username input field */}
          <TextInput
            label="Username"
            type="text"
            placeholder="your-username"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
            onBlur={() => handleBlur("username")}
            error={touched.username ? errors.username : ""}
            disabled={isLoading}
            required
            fullWidth
            icon={<User className="w-5 h-5" />}
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

          {/* No forgot password button - handled elsewhere if needed */}
        </form>
      </div>
    </motion.div>
  );
};
