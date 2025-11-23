import { motion } from "motion/react";
import type { ReactNode } from "react";

// Button variant types for different use cases
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

// Button size options
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  type = "button",
  className = "",
}: ButtonProps) => {
  // Base styles applied to all buttons
  const baseStyles =
    "font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1117] disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant-specific styles
  const variantStyles = {
    primary:
      "bg-[#3D7BF0] text-white hover:bg-[#2E6BD9] focus:ring-[#3D7BF0] active:bg-[#1F5BC8]",
    secondary:
      "bg-[#6BCB77] text-[#0D1117] hover:bg-[#5AB866] focus:ring-[#6BCB77] active:bg-[#49A555]",
    ghost:
      "bg-transparent text-[#C9D1D9] border border-[#30363D] hover:bg-[#161B22] focus:ring-[#3D7BF0] active:bg-[#0D1117]",
    danger:
      "bg-[#F85149] text-white hover:bg-[#E63E35] focus:ring-[#F85149] active:bg-[#D42B21]",
  };

  // Size-specific styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  // Width style
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      // Subtle scale animation on hover
      whileHover={!disabled ? { scale: 1.02 } : {}}
      // Slight scale down on click for tactile feedback
      whileTap={!disabled ? { scale: 0.98 } : {}}
      // Smooth transition for animations
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};
