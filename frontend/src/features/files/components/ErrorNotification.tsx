/**
 * ErrorNotification
 * ==================
 * Animated error message banner.
 */

import { motion } from 'motion/react';

// ============================================
// Types
// ============================================

export interface ErrorNotificationProps {
  /** Error message to display */
  message: string;
}

// ============================================
// Component
// ============================================

/**
 * Animated error banner with consistent styling.
 */
export const ErrorNotification = ({ message }: ErrorNotificationProps) => {
  return (
    <motion.div
      className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {message}
    </motion.div>
  );
};

export default ErrorNotification;
