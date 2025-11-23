import { motion } from "motion/react";
import type { InputHTMLAttributes } from "react";
import { forwardRef, useState } from "react";

// Input variant types to match button styling
type InputVariant = "default" | "error" | "success";

// Input size options to match button sizes
type InputSize = "sm" | "md" | "lg";

interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = "default",
      size = "md",
      fullWidth = false,
      icon,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Determine active variant (error takes precedence)
    const activeVariant = error ? "error" : variant;

    // Base styles for the input wrapper
    const wrapperStyles = fullWidth ? "w-full" : "";

    // Base input styles with smooth transitions
    const baseInputStyles =
      "w-full rounded-lg bg-[#161B22] border transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[#C9D1D9] placeholder:text-[#6E7681]";

    // Variant-specific border and ring colors
    const variantStyles = {
      default:
        "border-[#30363D] focus:border-[#3D7BF0] focus:ring-2 focus:ring-[#3D7BF0]/20",
      error:
        "border-[#F85149] focus:border-[#F85149] focus:ring-2 focus:ring-[#F85149]/20",
      success:
        "border-[#6BCB77] focus:border-[#6BCB77] focus:ring-2 focus:ring-[#6BCB77]/20",
    };

    // Size-specific padding and text sizes
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-5 py-3 text-lg",
    };

    // Adjust padding if icon is present
    const iconPadding = icon ? "pl-10" : "";

    // Label styles with subtle animation
    const labelStyles =
      "block text-sm font-medium mb-2 text-[#C9D1D9] transition-colors duration-200";

    // Helper text and error message styles
    const helperTextStyles = "mt-1.5 text-sm";
    const errorStyles = "text-[#F85149]";
    const defaultHelperStyles = "text-[#8B949E]";

    return (
      <div className={wrapperStyles}>
        {/* Label */}
        {label && (
          <label className={labelStyles}>
            {label}
            {props.required && <span className="text-[#F85149] ml-1">*</span>}
          </label>
        )}

        {/* Input Container with Icon */}
        <motion.div
          className="relative"
          // Subtle scale animation on focus
          animate={{
            scale: isFocused && !disabled ? 1.01 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Icon - positioned absolutely */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E] pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            {...props}
            disabled={disabled}
            className={`${baseInputStyles} ${variantStyles[activeVariant]} ${sizeStyles[size]} ${iconPadding} ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </motion.div>

        {/* Error Message or Helper Text */}
        {error ? (
          <motion.p
            className={`${helperTextStyles} ${errorStyles}`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        ) : helperText ? (
          <p className={`${helperTextStyles} ${defaultHelperStyles}`}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
