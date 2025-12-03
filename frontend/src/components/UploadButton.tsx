import { useRef, type FC, type ChangeEvent } from 'react';
import type { ConflictPayload, BatchUploadResponse } from '../features/files/types/file.types';
import { isApiError } from '../utils';
import { UploadCloud, FolderUp } from 'lucide-react';

/**
 * UploadButton Props
 */
interface UploadButtonProps {
    /** Callback when file(s) are selected - single file for backward compat */
    onUpload: (file: File, action?: 'replace' | 'keep_both') => Promise<void> | void;
    /** Callback when multiple files are selected (folder upload or multi-select) */
    onUploadMultiple?: (files: File[]) => Promise<BatchUploadResponse | null> | void;
    /** Button label text */
    label?: string;
    /** Whether button is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Accept attribute for file input (e.g., "image/*") */
    accept?: string;
    /** callback when an upload conflict occurs, receives the conflict payload and original file */
    onDuplicate?: (data: { conflict: ConflictPayload | null; file: File }) => void;
    /** Enable folder upload mode (uses webkitdirectory) */
    allowFolderUpload?: boolean;
}

/**
 * UploadButton Component
 * ======================
 * Reusable file upload button with hidden input.
 * Supports single file, multiple files, and folder uploads.
 * Folder uploads preserve directory structure via webkitRelativePath.
 *
 * Usage:
 *   <UploadButton onUpload={(file) => uploadFile(file)} />
 *   <UploadButton onUploadMultiple={(files) => uploadFiles(files)} allowFolderUpload />
 */
export const UploadButton: FC<UploadButtonProps> = ({
    onUpload,
    onUploadMultiple,
    label = 'Upload',
    disabled = false,
    className = '',
    accept,
    onDuplicate,
    allowFolderUpload = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);

    /**
     * Handle file input change event.
     * Routes to single or multi-file callback based on selection.
     */
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            if (files.length > 1 || (files.length === 1 && onUploadMultiple)) {
                // Multiple files selected - use batch upload if available
                if (onUploadMultiple) {
                    await onUploadMultiple(Array.from(files));
                } else {
                    // Fallback: upload first file only
                    await onUpload(files[0]);
                }
            } else {
                // Single file upload
                await onUpload(files[0]);
            }
        } catch (err: unknown) {
            // If the backend returned a 409 conflict, notify the parent via onDuplicate
            if (isApiError(err) && err.status === 409 && onDuplicate && files.length === 1) {
                try {
                    onDuplicate({ conflict: err.payload?.conflict ?? null, file: files[0] });
                } catch {
                    /* ignore */
                }
                return;
            }
            throw err;
        } finally {
            // Reset input to allow re-uploading same file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /**
     * Handle folder input change event.
     * Uses webkitdirectory to select entire folders.
     */
    const handleFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            if (onUploadMultiple) {
                await onUploadMultiple(Array.from(files));
            }
        } finally {
            if (folderInputRef.current) {
                folderInputRef.current.value = '';
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Regular file upload button */}
            <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2EA043] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
            >
                <UploadCloud className="w-4 h-4" />
                {label}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={accept}
                disabled={disabled}
                multiple
            />

            {/* Folder upload button (optional) */}
            {allowFolderUpload && onUploadMultiple && (
                <>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#1F6FEB] hover:bg-[#388BFD] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => folderInputRef.current?.click()}
                        disabled={disabled}
                        title="Upload entire folder"
                    >
                        <FolderUp className="w-4 h-4" />
                        Folder
                    </button>
                    <input
                        ref={folderInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFolderChange}
                        disabled={disabled}
                        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                    />
                </>
            )}
        </div>
    );
};

export default UploadButton;
