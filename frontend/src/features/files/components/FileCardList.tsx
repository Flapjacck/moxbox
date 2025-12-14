import { motion } from 'motion/react';
import { Eye, DownloadCloud, Trash2, RotateCcw, XCircle } from 'lucide-react';
import type { FC } from 'react';
import type { FileItem, FileType } from '../types/file.types';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import FileIcon from './FileIcon';
import { isPreviewable } from '../../../utils';

/** Props for internal list card component */
interface FileCardListInternalProps {
  file: FileItem;
  fileType: FileType;
  onPreview?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onRestore?: (file: FileItem) => void;
  onPermanentDelete?: (file: FileItem) => void;
  className?: string;
}

/**
 * FileCardList
 * List variant for the FileCard UI. Displays file metadata inline
 * with actions for download/delete or restore/permanent-delete.
 */
export const FileCardList: FC<FileCardListInternalProps> = ({
  file,
  fileType = 'other',
  onPreview,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  className = '',
}) => {
  const isDeleted = file.status === 'deleted';
  const canPreview = isPreviewable(file.mimeType);
  const base =
    'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-all duration-200 hover:border-[#6BCB77] hover:shadow-[0_10px_30px_rgba(107,203,119,0.06)]';

  return (
    <motion.div
      className={`${base} p-4 flex items-center gap-4 ${className} ${isDeleted ? 'opacity-70' : ''}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
    >
      {/* File icon */}
      <div className="w-12 h-12 flex items-center justify-center rounded-md bg-[#0F1724] shrink-0">
        <FileIcon type={fileType} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-2">
          <div className="font-semibold text-sm truncate text-[#F0F6FC]" title={file.originalName}>
            {file.originalName}
          </div>
          <div className="text-xs text-[#6B7280] shrink-0">
            {file.size ? formatFileSize(file.size) : '—'}
          </div>
        </div>
        {/* Show folder/dir path when file is in Trash to disambiguate similarly-named files */}
        {isDeleted && (
          <div
            className="text-xs text-[#6B7280] mb-1 truncate"
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
        <div className="text-xs text-[#6B7280]">
          {formatDate(file.createdAt)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {isDeleted ? (
          // Trash view actions
          <>
            <button
              aria-label="restore"
              title="Restore file"
              onClick={() => onRestore?.(file)}
              className="p-1 hover:bg-[#0D1117] rounded text-[#6BCB77]"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              aria-label="permanent delete"
              title="Delete permanently"
              onClick={() => onPermanentDelete?.(file)}
              className="p-1 hover:bg-[#0D1117] rounded text-[#F85149]"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </>
        ) : (
          // Normal view actions: preview, download & delete
          <>
            {canPreview && (
              <button
                aria-label="preview"
                title="Preview file"
                onClick={() => onPreview?.(file)}
                className="p-1 hover:bg-[#0D1117] rounded hover:text-[#58A6FF]"
              >
                <Eye className="w-5 h-5" />
              </button>
            )}
            <button
              aria-label="download"
              onClick={() => onDownload?.(file)}
              className="p-1 hover:bg-[#0D1117] rounded hover:text-[#6BCB77]"
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button
              aria-label="delete"
              onClick={() => onDelete?.(file)}
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

export default FileCardList;
