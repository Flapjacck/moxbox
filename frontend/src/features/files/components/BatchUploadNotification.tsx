/**
 * BatchUploadNotification
 * ========================
 * Notification banner showing batch upload results.
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { BatchUploadResponse } from '../types/file.types';

// ============================================
// Types
// ============================================

export interface BatchUploadNotificationProps {
  /** The batch upload result */
  result: BatchUploadResponse;
  /** Callback to dismiss the notification */
  onDismiss: () => void;
  /** Auto-dismiss delay in milliseconds (default: 5000) */
  autoDismissDelay?: number;
}

// ============================================
// Component
// ============================================

/**
 * Animated notification showing upload success/failure counts.
 * Auto-dismisses after 5 seconds by default.
 */
export const BatchUploadNotification = ({
  result,
  onDismiss,
  autoDismissDelay = 5000,
}: BatchUploadNotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissDelay);
    return () => clearTimeout(timer);
  }, [onDismiss, autoDismissDelay]);
  return (
    <motion.div
      className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <span>
          Uploaded {result.successCount} of {result.totalCount} files
          {result.failureCount > 0 && ` (${result.failureCount} failed)`}
        </span>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-200 text-xs"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
};

export default BatchUploadNotification;
