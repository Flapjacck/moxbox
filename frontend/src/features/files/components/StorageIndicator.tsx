import { HardDrive } from 'lucide-react';
import { formatFileSize } from '../utils/fileUtils';

/**
 * StorageIndicator
 * ================
 * Minimal storage usage indicator for root directory.
 * Shows total space used with icon. Subtle and clean.
 */

interface StorageIndicatorProps {
  /** Total root directory size in bytes */
  totalSize: number | undefined;
}

export const StorageIndicator = ({ totalSize }: StorageIndicatorProps) => {
  if (totalSize === undefined) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-[#8B949E]">
      <HardDrive className="w-4 h-4" />
      <span>{formatFileSize(totalSize)} used</span>
    </div>
  );
};

export default StorageIndicator;
