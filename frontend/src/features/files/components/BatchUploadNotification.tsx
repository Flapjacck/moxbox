/**
 * BatchUploadNotification
 * ========================
 * Notification banner showing batch upload results.
 */

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
}

// ============================================
// Component
// ============================================

/**
 * Animated notification showing upload success/failure counts.
 */
export const BatchUploadNotification = ({
  result,
  onDismiss,
}: BatchUploadNotificationProps) => {
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
