import { motion } from 'motion/react';
import { DownloadCloud, Trash2, RotateCcw, XCircle } from 'lucide-react';
import type { FC } from 'react';
import type { FileItem, FileType } from '../types/file.types';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import FileIcon from './FileIcon';

/** Props for internal grid card component */
interface FileCardGridInternalProps {
  file: FileItem;
  fileType: FileType;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onPermanentDelete?: (file: FileItem) => void;
  className?: string;
}

/**
 * FileCardGrid
 * Grid variant for the FileCard UI. Displays file metadata including
 * name, size, and creation date. Supports trash view with restore/delete actions.
 */
export const FileCardGrid: FC<FileCardGridInternalProps> = ({
  file,
  fileType = 'other',
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  className = '',
}) => {
  const isDeleted = file.status === 'deleted';
  const base =
    'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-shadow duration-200 hover:border-[#6BCB77] hover:shadow-[0_10px_30px_rgba(107,203,119,0.06)]';

  return (
    <motion.div
      className={`${base} p-2 flex flex-col items-center justify-between h-48 group ${className} ${isDeleted ? 'opacity-70' : ''}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* File icon */}
      <div className="w-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-md bg-[#0F1724] flex items-center justify-center overflow-hidden">
          <FileIcon type={fileType} />
        </div>
      </div>

      {/* File info */}
      <div className="mt-3 flex-1 w-full text-center">
        <div className="font-semibold text-base truncate" title={file.originalName}>
          {file.originalName}
        </div>
        <div className="text-xs text-[#8B949E] mt-1">
          {file.size ? formatFileSize(file.size) : 'Unknown size'}
        </div>
        <div className="text-xs text-[#8B949E]">
          {formatDate(file.createdAt)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-2 flex items-center gap-2 justify-center">
        {isDeleted ? (
          // Trash view actions: restore & permanent delete
          <>
            <button
              onClick={() => onRestore?.(file)}
              aria-label="restore"
              title="Restore file"
              className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#6BCB77]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPermanentDelete?.(file)}
              aria-label="permanent delete"
              title="Delete permanently"
              className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#F85149]"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </>
        ) : (
          // Normal view actions: download & soft delete
          <>
            <button
              onClick={() => onDownload?.(file)}
              aria-label="download"
              className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#6BCB77]"
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete?.(file)}
              aria-label="delete"
              className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#F85149]"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FileCardGrid;
