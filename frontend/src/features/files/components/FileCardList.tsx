import { motion } from 'motion/react';
import { DownloadCloud, Trash2 } from 'lucide-react';
import type { FC } from 'react';
import type { FileCardProps } from '../types/file.types';
import FileIcon from './FileIcon';

/**
 * FileCardList
 * List variant for the FileCard UI. Keeps the list layout and actions
 * separate from the main FileCard wrapper.
 */
export const FileCardList: FC<FileCardProps> = ({
  fileName,
  fileType = 'other',
  onDownload,
  onDelete,
  className = '',
}) => {
  const base =
    'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-shadow duration-200 hover:border-[#6BCB77] hover:shadow-[0_10px_30px_rgba(107,203,119,0.06)]';

  return (
    <motion.div className={`${base} p-3 flex items-center gap-3 ${className}`} whileHover={{ scale: 1.01 }} transition={{ duration: 0.12 }}>
      <div className="w-14 h-14 flex items-center justify-center rounded-md bg-[#0F1724]">
        <FileIcon type={fileType} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="font-medium truncate" title={fileName}>
            {fileName}
          </div>
          <div className="text-sm text-[#8B949E]">{/* size not available from backend */}</div>
        </div>
        <div className="text-sm text-[#8B949E] mt-1">{/* upload date not available from backend */}</div>
      </div>

      <div className="flex items-center gap-2">
        <button aria-label="download" onClick={onDownload} className="p-1 hover:bg-[#0D1117] rounded">
          <DownloadCloud className="w-5 h-5" />
        </button>
        <button aria-label="delete" onClick={onDelete} className="p-1 hover:bg-[#0D1117] rounded">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default FileCardList;
