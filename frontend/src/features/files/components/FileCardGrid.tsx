import { motion } from 'motion/react';
import { Eye, DownloadCloud, Trash2, RotateCcw, XCircle, MoveRight } from 'lucide-react';
import type { FC } from 'react';
import type { FileItem, FileType } from '../types/file.types';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import FileIcon from './FileIcon';
import { isPreviewable } from '../../../utils';

/** Props for internal grid card component */
interface FileCardGridInternalProps {
  file: FileItem;
  fileType: FileType;
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onPermanentDelete?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
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
  onPreview,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  onMove,
  className = '',
}) => {
  const isDeleted = file.status === 'deleted';
  const canPreview = isPreviewable(file.mimeType);
  const base =
    'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-all duration-200 hover:border-[#3D7B4F] hover:shadow-[0_0_0_1px_rgba(107,203,119,0.1)]';

  return (
    <motion.div
      className={`${base} p-3 flex flex-col items-center justify-between h-56 group ${className} ${isDeleted ? 'opacity-70' : ''}`}
      whileHover={{}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* File icon */}
      <div className="w-full flex items-center justify-center pt-2">
        <div className="w-16 h-16 rounded-lg bg-[#0F1724] flex items-center justify-center overflow-hidden">
          <FileIcon type={fileType} />
        </div>
      </div>

      {/* File info */}
      <div className="mt-4 flex-1 w-full text-center flex flex-col">
        <div className="font-semibold text-sm truncate text-[#F0F6FC] px-1" title={file.originalName}>
          {file.originalName}
        </div>
        {/* Show folder/dir path when file is in Trash to disambiguate similarly-named files */}
        {isDeleted && (
          <div
            className="text-xs text-[#6B7280] mt-2 truncate px-1"
            title={
              file.storagePath?.split('/').slice(0, -1).join('/')
                ? `{root}/${file.storagePath?.split('/').slice(0, -1).join('/')}`
                : '{root}'
            }
          >
            {file.storagePath?.split('/').slice(0, -1).join('/')
              ? `{root}/${file.storagePath?.split('/').slice(0, -1).join('/')}`
              : '{root}'}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[#21262D] w-full">
          <div className="text-xs text-[#6B7280] mb-1">
            {file.size ? formatFileSize(file.size) : 'Unknown'}
          </div>
          <div className="text-xs text-[#6B7280]">
            {formatDate(file.createdAt)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-1 justify-center pb-1">
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
          // Normal view actions: preview, download & soft delete
          <>
            {canPreview && (
              <button
                onClick={() => onPreview?.(file)}
                aria-label="preview"
                title="Preview file"
                className="p-1 hover:bg-[#0D1117] rounded hover:text-[#58A6FF]"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onDownload?.(file)}
              aria-label="download"
              className="p-1 hover:bg-[#0D1117] rounded hover:text-[#6BCB77]"
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button
              onClick={() => onMove?.(file)}
              aria-label="move"
              title="Move to folder"
              className="p-1 hover:bg-[#0D1117] rounded hover:text-[#58A6FF]"
            >
              <MoveRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete?.(file)}
              aria-label="delete"
              className="p-1 hover:bg-[#0D1117] rounded hover:text-[#F85149]"
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
