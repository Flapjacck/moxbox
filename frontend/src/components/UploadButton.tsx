import { useRef, type FC, type ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';

/**
 * UploadButton Props
 */
interface UploadButtonProps {
    /** Callback when file is selected */
    onUpload: (file: File) => Promise<void> | void;
    /** Button label text */
    label?: string;
    /** Whether button is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Accept attribute for file input (e.g., "image/*") */
    accept?: string;
}

/**
 * UploadButton Component
 * ======================
 * Reusable file upload button with hidden input.
 * Handles file selection and delegates upload to parent.
 * 
 * Usage:
 *   <UploadButton onUpload={(file) => uploadFile(file, currentFolder)} />
 */
export const UploadButton: FC<UploadButtonProps> = ({
    onUpload,
    label = 'Upload',
    disabled = false,
    className = '',
    accept,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    /**
     * Handle file input change event.
     * Calls onUpload with selected file, then resets input.
     */
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        try {
            await onUpload(file);
        } finally {
            // Reset input to allow re-uploading same file, even if upload fails
            // Use the ref when available to ensure we're clearing the actual element
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            } else {
                try { e.currentTarget.value = ''; } catch { /* ignore */ }
            }
        }
    };

    return (
        <div className={className}>
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
            />
        </div>
    );
};

export default UploadButton;
