import type { FC } from 'react';
import { inferFileType } from '../utils/fileUtils';
import type { FileCardProps } from '../types/file.types';
import FileCardGrid from './FileCardGrid';
import FileCardList from './FileCardList';

/**
 * FileCard
 * A lightweight visual card used to display file metadata.
 * Supports two simple visual variants: list and grid.
 */
export const FileCard: FC<FileCardProps> = ({ fileName, fileType, variant = 'list', onDownload, onDelete, className = '' }) => {
  // Determine the FileType to be used by child components. Prefer the
  // explicit prop from parent; fall back to our filename-based inference.
  const resolvedType = fileType ?? inferFileType(fileName);

  // Choose and render the right visual variant while delegating rendering
  // details to the small list/grid components we created.
  if (variant === 'grid') {
    return <FileCardGrid fileName={fileName} fileType={resolvedType} onDownload={onDownload} onDelete={onDelete} className={className} />;
  }

  return <FileCardList fileName={fileName} fileType={resolvedType} onDownload={onDownload} onDelete={onDelete} className={className} />;
};

export default FileCard;
