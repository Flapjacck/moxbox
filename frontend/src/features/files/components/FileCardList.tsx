import { motion } from 'motion/react';
import { DownloadCloud, Trash2, RotateCcw, XCircle } from 'lucide-react';
import type { FC } from 'react';
import type { FileItem, FileType } from '../types/file.types';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import FileIcon from './FileIcon';

/** Props for internal list card component */
interface FileCardListInternalProps {
  file: FileItem;
  fileType: FileType;
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
      className={`${base} p-3 flex items-center gap-3 ${className} ${isDeleted ? 'opacity-70' : ''}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
    >
      {/* File icon */}
      <div className="w-14 h-14 flex items-center justify-center rounded-md bg-[#0F1724]">
        <FileIcon type={fileType} />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="font-medium truncate" title={file.originalName}>
            {file.originalName}
          </div>
          <div className="text-sm text-[#8B949E] shrink-0">
            {file.size ? formatFileSize(file.size) : '—'}
          </div>
        </div>
        {/* Show folder/dir path when file is in Trash to disambiguate similarly-named files */}
        {isDeleted && (
          <div
            className="text-sm text-[#8B949E] mt-1 truncate"
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
        <div className="text-sm text-[#8B949E] mt-1">
          {formatDate(file.createdAt)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
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
          // Normal view actions
          <>
            <button
              aria-label="download"
              onClick={() => onDownload?.(file)}
              className="p-1 hover:bg-[#0D1117] rounded"
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button
              aria-label="delete"
              onClick={() => onDelete?.(file)}
              className="p-1 hover:bg-[#0D1117] rounded"
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
