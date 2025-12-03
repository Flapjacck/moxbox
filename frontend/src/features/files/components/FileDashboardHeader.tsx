/**
 * FileDashboardHeader
 * ====================
 * Header component for the FileDashboard page.
 * Contains the title and action buttons (New Folder, Trash link).
 */

import { FolderPlus, Trash2 } from 'lucide-react';

// ============================================
// Types
// ============================================

export interface FileDashboardHeaderProps {
  /** Callback when "New Folder" is clicked */
  onCreateFolder: () => void;
}

// ============================================
// Component
// ============================================

/**
 * Page header with title and quick actions.
 */
export const FileDashboardHeader = ({
  onCreateFolder,
}: FileDashboardHeaderProps) => {
  return (
    <header className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">My Files</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateFolder}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
        <a
          href="/trash"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Trash
        </a>
      </div>
    </header>
  );
};

export default FileDashboardHeader;
