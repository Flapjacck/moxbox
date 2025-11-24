import { motion } from 'motion/react';
import { DownloadCloud, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { FileCardProps } from '../types/file.types';
import FileIcon from './FileIcon';

/**
 * FileCardGrid
 * Grid variant for the FileCard UI. Designed to be small and focused
 * so it only concerns itself with layout and actions. Icon and props
 * come from the shared types and FileIcon component.
 */
export const FileCardGrid: FC<FileCardProps> = ({
  fileName,
  fileType = 'other',
  onDownload,
  onDelete,
  className = '',
}) => {
  const base =
    'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-shadow duration-200 hover:border-[#6BCB77] hover:shadow-[0_10px_30px_rgba(107,203,119,0.06)]';

  return (
    <motion.div
      className={`${base} p-2 flex flex-col items-center justify-between h-44 group ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className="w-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-md bg-[#0F1724] flex items-center justify-center overflow-hidden">
          <FileIcon type={fileType} />
        </div>
      </div>

      <div className="mt-3 flex-1 w-full text-center">
        <div className="font-semibold text-base truncate" title={fileName}>
          {fileName}
        </div>
        <div className="text-sm text-[#8B949E] mt-1">{/* Backend does not provide size/upload date */}</div>
      </div>
      <div className="mt-2 flex items-center gap-2 justify-center">
        <div className="flex items-center gap-2">
          <button onClick={onDownload} aria-label="download" className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#6BCB77]">
            <DownloadCloud className="w-5 h-5" />
          </button>
          <button onClick={onDelete} aria-label="delete" className="p-1 hover:bg-[#0D1117] rounded group-hover:text-[#F85149]">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FileCardGrid;
