import {
  FileText,
  File,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
} from 'lucide-react';
import type { FC } from 'react';
import type { FileType } from '../types/file.types';

/**
 * FileIcon
 * Small presentational component that returns the correct icon
 * for a FileType. This keeps UI files cleaner and centralizes
 * the dependency on lucide-react.
 */
export const FileIcon: FC<{ type: FileType; className?: string }> = ({ type, className = 'w-6 h-6 text-[#8B949E]' }) => {
  if (type === 'image') return <ImageIcon className={className} />;
  if (type === 'video') return <Video className={className} />;
  if (type === 'audio') return <Music className={className} />;
  if (type === 'document') return <FileText className={className} />;
  if (type === 'archive') return <Archive className={className} />;
  return <File className={className} />;
};

export default FileIcon;
