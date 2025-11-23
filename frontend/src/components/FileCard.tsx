import { motion } from "motion/react";
import {
  FileText,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  DownloadCloud,
  Trash2,
} from "lucide-react";
import type { FC } from "react";

export type FileType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other";

interface FileCardProps {
  fileName: string;
  fileType?: FileType;
  fileSize?: string;
  uploadedAt?: string;
  thumbnailUrl?: string;
  variant?: "list" | "grid";
  onDownload?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * FileCard
 * A lightweight visual card used to display file metadata.
 * Supports two simple visual variants: list and grid.
 */
export const FileCard: FC<FileCardProps> = ({
  fileName,
  fileType = "other",
  fileSize = "-",
  uploadedAt = "-",
  thumbnailUrl,
  variant = "list",
  // isFavorite removed per request - visual-only component
  onDownload,
  onDelete,
  className = "",
}) => {
  // Pick icon based on file type
  const Icon =
    fileType === "image"
      ? ImageIcon
      : fileType === "video"
      ? Video
      : fileType === "audio"
      ? Music
      : fileType === "document"
      ? FileText
      : fileType === "archive"
      ? Archive
      : File;

  const base =
    "bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-shadow duration-200 hover:border-[#6BCB77] hover:shadow-[0_10px_30px_rgba(107,203,119,0.06)]";

  if (variant === "grid") {
    return (
      <motion.div
        className={`${base} p-2 flex flex-col items-center justify-between h-44 group ${className}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <div className="w-full flex items-center justify-center">
          <div className="w-12 h-12 rounded-md bg-[#0F1724] flex items-center justify-center overflow-hidden">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={fileName} className="w-full h-full object-cover" />
            ) : (
              <Icon className="w-6 h-6 text-[#8B949E]" />
            )}
          </div>
        </div>

        <div className="mt-3 flex-1 w-full text-center">
          <div className="font-semibold text-base truncate" title={fileName}>{fileName}</div>
          <div className="text-sm text-[#8B949E] flex items-center justify-center gap-3 mt-1">
            <span>{fileSize}</span>
            <span>{uploadedAt}</span>
          </div>
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
  }

  // List variant
  return (
    <motion.div
      className={`${base} p-3 flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.12 }}
    >
      <div className="w-14 h-14 flex items-center justify-center rounded-md bg-[#0F1724]">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={fileName} className="w-full h-full object-cover rounded-sm" />
        ) : (
          <Icon className="w-6 h-6 text-[#8B949E]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 justify-between">
          <div className="font-medium truncate" title={fileName}>{fileName}</div>
          <div className="text-sm text-[#8B949E]">{fileSize}</div>
        </div>
        <div className="text-sm text-[#8B949E] mt-1 flex items-center gap-2">
          <span className="truncate">{uploadedAt}</span>
        </div>
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

export default FileCard;
