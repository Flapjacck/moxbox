/**
 * FileGrid
 * =========
 * Renders files and folders in a grid or list layout.
 */

import { motion } from 'motion/react';
import { FileCard } from './FileCard';
import { FolderCard } from '../../folders/components';
import type { FileItem } from '../types/file.types';
import type { DirectoryEntry } from '../../folders/types/folder.types';

// ============================================
// Types
// ============================================

export interface FileGridProps {
  /** Current folder path (for building subfolder paths) */
  currentPath: string;
  /** Files to display */
  files: FileItem[];
  /** Folders to display */
  folders: DirectoryEntry[];
  /** Layout variant */
  view: 'list' | 'grid';
  /** Preview file callback */
  onPreview: (file: FileItem) => void;
  /** Download file callback */
  onDownload: (file: FileItem) => void;
  /** Delete file callback */
  onDelete: (file: FileItem) => void;
  /** Move file callback */
  onMove: (file: FileItem) => void;
  /** Navigate to folder callback */
  onFolderClick: (path: string) => void;
  /** Delete folder callback */
  onFolderDelete: (path: string) => void;
}

// ============================================
// Component
// ============================================

/**
 * Responsive grid/list layout for files and folders.
 * Folders are displayed first, then files.
 */
export const FileGrid = ({
  currentPath,
  files,
  folders,
  view,
  onPreview,
  onDownload,
  onDelete,
  onMove,
  onFolderClick,
  onFolderDelete,
}: FileGridProps) => {
  const gridClass =
    view === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
      : 'flex flex-col gap-2';

  return (
    <motion.div
      className={gridClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Folders first */}
      {folders.map((folder) => (
        <FolderCard
          key={folder.name}
          name={folder.name}
          path={currentPath ? `${currentPath}/${folder.name}` : folder.name}
          size={folder.size}
          variant={view}
          onClick={onFolderClick}
          onDelete={onFolderDelete}
        />
      ))}

      {/* Then files */}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          variant={view}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </motion.div>
  );
};

export default FileGrid;
