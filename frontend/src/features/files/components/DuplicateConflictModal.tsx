/**
 * DuplicateConflictModal
 * =======================
 * Modal for resolving single-file upload conflicts.
 * Shows when a file with the same name already exists.
 */

import type { ConflictPayload } from '../types/file.types';

// ============================================
// Types
// ============================================

export interface DuplicateConflictModalProps {
  /** Conflict information from backend (null if unavailable) */
  conflict: ConflictPayload | null;
  /** The file being uploaded */
  file: File;
  /** Callback when user resolves conflict */
  onResolve: (action: 'replace' | 'keep_both') => void;
  /** Callback when user cancels */
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

/**
 * Modal displayed when uploading a file that already exists.
 * Offers options to keep both (rename) or replace the existing file.
 */
export const DuplicateConflictModal = ({
  conflict,
  file,
  onResolve,
  onCancel,
}: DuplicateConflictModalProps) => {
  // Display name: prefer conflict info, fallback to file.name
  const displayName = conflict?.originalName ?? file.name;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0B1220] rounded-lg p-6 w-96 border border-[#30363D]">
        {/* Header */}
        <h3 className="text-lg font-semibold mb-2 text-slate-100">
          Upload Conflict
        </h3>

        {/* Message */}
        <p className="text-sm text-slate-300 mb-4">
          A file named{' '}
          <strong className="text-slate-100">{displayName}</strong>{' '}
          already exists in this folder.
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
            Replace
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateConflictModal;
