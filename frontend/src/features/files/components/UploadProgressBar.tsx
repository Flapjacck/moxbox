/**
 * UploadProgressBar Component
 * ============================
 * Minimal progress indicator for file uploads.
 * Shows upload percentage and cancel button.
 */

import { X } from 'lucide-react';
import type { UploadProgress } from '../types/file.types';

// ============================================
// Types
// ============================================

export interface UploadProgressBarProps {
    /** Current upload progress state */
    progress: UploadProgress;
    /** Callback to cancel the upload */
    onCancel: () => void;
}

// ============================================
// Component
// ============================================

/**
 * Compact progress bar for active uploads.
 * Matches site theme with dark background and accent colors.
 */
export const UploadProgressBar = ({ progress, onCancel }: UploadProgressBarProps) => {
    if (!progress.isUploading) return null;

    const { percent, fileCount } = progress;
    const label = fileCount > 1
        ? `Uploading ${fileCount} files...`
        : 'Uploading...';

    return (
        <div className="flex items-center gap-3 px-3 py-2 bg-[#161B22] border border-[#30363D] rounded-lg">
            {/* Progress info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-300 truncate">{label}</span>
                    <span className="text-xs text-slate-400 ml-2">{percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-[#0D1117] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#238636] rounded-full transition-all duration-150"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Cancel button */}
            <button
                onClick={onCancel}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="Cancel upload"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default UploadProgressBar;
