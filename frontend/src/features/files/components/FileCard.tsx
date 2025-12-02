import type { FC } from 'react';
import { inferFileType } from '../utils/fileUtils';
import type { FileCardProps } from '../types/file.types';
import FileCardGrid from './FileCardGrid';
import FileCardList from './FileCardList';

/**
 * FileCard
 * A lightweight visual card used to display file metadata.
 * Supports two simple visual variants: list and grid.
 * Now accepts a FileItem object with full metadata.
 */
export const FileCard: FC<FileCardProps> = ({
  file,
  variant = 'list',
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  className = '',
}) => {
  // Infer file type from the original filename for icon display
  const resolvedType = inferFileType(file.originalName);

  // Choose and render the right visual variant
  if (variant === 'grid') {
    return (
      <FileCardGrid
        file={file}
        fileType={resolvedType}
        onDownload={onDownload}
        onDelete={onDelete}
        onRestore={onRestore}
        onPermanentDelete={onPermanentDelete}
        className={className}
      />
    );
  }

  return (
    <FileCardList
      file={file}
      fileType={resolvedType}
      onDownload={onDownload}
      onDelete={onDelete}
      onRestore={onRestore}
      onPermanentDelete={onPermanentDelete}
      className={className}
    />
  );
};

export default FileCard;
