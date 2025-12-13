/**
 * FileDashboardHeader
 * ====================
 * Header component for the FileDashboard page.
 * Contains the title, storage indicator, and action buttons.
 */

import { FolderPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StorageIndicator } from './StorageIndicator';

// ============================================
// Types
// ============================================

export interface FileDashboardHeaderProps {
  /** Callback when "New Folder" is clicked */
  onCreateFolder: () => void;
  /** Root directory total size (for storage display) */
  rootSize?: number;
  /** Current folder path to restore from trash */
  currentPath?: string;
}

// ============================================
// Component
// ============================================

/**
 * Page header with title, storage indicator, and quick actions.
 */
export const FileDashboardHeader = ({
  onCreateFolder,
  rootSize,
  currentPath = '',
}: FileDashboardHeaderProps) => {
  const navigate = useNavigate();

  // Navigate to trash, passing current folder as state for return navigation
  const handleTrashClick = () => {
    navigate('/trash', { state: { from: currentPath } });
  };

  return (
    <header className="mb-4 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">My Files</h1>
        <StorageIndicator totalSize={rootSize} />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateFolder}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          New Folder
        </button>
        <button
          onClick={handleTrashClick}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Trash
        </button>
      </div>
    </header>
  );
};

export default FileDashboardHeader;
