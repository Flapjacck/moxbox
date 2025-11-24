/**
 * File types and shared UI props for the files feature
 *
 * Centralizing these definitions helps keep components consistent
 * and keeps future backend additions easier to merge.
 */

export type FileType =
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'archive'
    | 'other';

export interface FileCardProps {
    /** The display filename (used for title / download path) */
    fileName: string;
    /** Optional override for the inferred file type */
    fileType?: FileType;
    /** Visual style of the card - list or grid */
    variant?: 'list' | 'grid';
    /** Callbacks for actions */
    onDownload?: () => void;
    onDelete?: () => void;
    /** Optional extra className for layout overrides */
    className?: string;
}
