/**
 * BatchUploadConflictModal
 * =========================
 * Modal for resolving batch upload conflicts.
 * Shows when multiple files already exist at their target paths.
 */

import type { BatchConflictInfo } from '../types/file.types';

// ============================================
// Types
// ============================================

export interface BatchUploadConflictModalProps {
  /** List of files with conflicts */
  conflicts: BatchConflictInfo[];
  /** Total files in the batch upload */
  totalFiles: number;
  /** Callback when user resolves conflicts */
  onResolve: (action: 'replace' | 'keep_both') => void;
  /** Callback when user cancels the upload */
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

/**
 * Modal displayed when batch uploading files that already exist.
 * Shows a list of conflicting files and offers bulk resolution options.
 */
export const BatchUploadConflictModal = ({
  conflicts,
  totalFiles,
  onResolve,
  onCancel,
}: BatchUploadConflictModalProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0B1220] rounded-lg p-6 w-md max-w-lg border border-[#30363D]">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-2 text-slate-100">
          Upload Conflicts
        </h3>

        {/* Summary */}
        <p className="text-sm text-slate-300 mb-3">
          {conflicts.length} of {totalFiles} files already exist:
        </p>

        {/* Conflict list */}
        <ul className="text-sm text-slate-400 mb-4 max-h-32 overflow-y-auto bg-[#161B22] rounded p-2">
          {conflicts.map((c, i) => (
            <li key={i} className="truncate py-0.5">
              •{' '}
              <span className="text-slate-200">{c.originalName}</span>
              {c.folder && (
                <span className="text-slate-500 ml-1">in {c.folder}</span>
              )}
            </li>
          ))}
        </ul>

        {/* Helper text */}
        <p className="text-xs text-slate-500 mb-4">
          Choose an action to apply to all conflicting files:
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            className="px-3 py-1.5 rounded bg-[#161B22] text-slate-200 hover:bg-[#21262D] transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 rounded bg-[#2EA043] text-white hover:bg-[#3FB950] transition-colors"
            onClick={() => onResolve('keep_both')}
          >
            Keep both (rename)
          </button>
          <button
            className="px-3 py-1.5 rounded bg-[#E11D48] text-white hover:bg-[#F43F5E] transition-colors"
            onClick={() => onResolve('replace')}
          >
            Replace all
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchUploadConflictModal;
