import { motion } from 'motion/react';
import { Folder, Trash2, Edit2 } from 'lucide-react';
import type { FC } from 'react';
import { formatFileSize } from '../../files/utils/fileUtils';

/**
 * FolderCard Props
 */
interface FolderCardProps {
    /** Folder name */
    name: string;
    /** Full folder path */
    path: string;
    /** Folder size in bytes (optional) */
    size?: number;
    /** Callback when folder is clicked (navigate into) */
    onClick: (path: string) => void;
    /** Callback for rename action */
    onRename?: (path: string) => void;
    /** Callback for delete action */
    onDelete?: (path: string) => void;
    /** Card layout variant */
    variant?: 'list' | 'grid';
    /** Additional CSS classes */
    className?: string;
}

/**
 * FolderCard Component
 * ====================
 * Displays a folder with navigation and action buttons.
 * Supports both list and grid variants.
 */
export const FolderCard: FC<FolderCardProps> = ({
    name,
    path,
    size,
    onClick,
    onRename,
    onDelete,
    variant = 'list',
    className = '',
}) => {
    const base =
        'bg-[#161B22] border border-[#30363D] rounded-lg text-[#C9D1D9] overflow-hidden transition-all duration-200 hover:border-[#2D5F9E] hover:shadow-[0_0_0_1px_rgba(88,166,255,0.1)] cursor-pointer group';

    // Grid variant
    if (variant === 'grid') {
        return (
            <motion.div
                className={`${base} p-3 flex flex-col items-center justify-center h-36 ${className}`}
                whileHover={{}}
                whileTap={{}}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => onClick(path)}
            >
                {/* Folder icon */}
                <div className="w-12 h-12 rounded-md bg-[#0F1724] flex items-center justify-center mb-2">
                    <Folder className="w-7 h-7 text-[#58A6FF]" />
                </div>

                {/* Folder name */}
                <div className="font-medium text-sm truncate w-full text-center" title={name}>
                    {name}
                </div>

                {/* Folder size */}
                {size !== undefined && (
                    <div className="text-xs text-[#8B949E] mt-1">
                        {formatFileSize(size)}
                    </div>
                )}

                {/* Actions (show on hover - desktop, always visible on mobile) */}
                <div className="mt-2 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {onRename && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRename(path); }}
                            aria-label="rename"
                            className="p-1 hover:bg-[#0D1117] rounded text-slate-400 hover:text-[#58A6FF]"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(path); }}
                            aria-label="delete"
                            className="p-1 hover:bg-[#0D1117] rounded text-slate-400 hover:text-[#F85149]"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // List variant (default)
    return (
        <motion.div
            className={`${base} p-3 flex items-center gap-3 ${className}`}
            whileHover={{}}
            whileTap={{}}
            transition={{ duration: 0.12 }}
            onClick={() => onClick(path)}
        >
            {/* Folder icon */}
            <div className="w-10 h-10 flex items-center justify-center rounded-md bg-[#0F1724]">
                <Folder className="w-5 h-5 text-[#58A6FF]" />
            </div>

            {/* Folder name and size */}
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate" title={name}>
                    {name}
                </div>
                <div className="text-xs text-[#8B949E]">
                    Folder {size !== undefined ? `• ${formatFileSize(size)}` : ''}
                </div>
            </div>

            {/* Actions (show on hover - desktop, always visible on mobile) */}
            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {onRename && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRename(path); }}
                        aria-label="rename"
                        className="p-1 hover:bg-[#0D1117] rounded text-slate-400 hover:text-[#58A6FF]"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(path); }}
                        aria-label="delete"
                        className="p-1 hover:bg-[#0D1117] rounded text-slate-400 hover:text-[#F85149]"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default FolderCard;
