/**
 * FilePreviewModal
 * =================
 * Modal for previewing files inline (images, videos, PDFs, audio, text/code).
 * Mobile-friendly with responsive sizing and touch-friendly controls.
 */

import { useEffect, useCallback, type FC } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { FileItem } from '../types/file.types';
import { getPreviewType } from '../../../utils';

// ============================================
// Types
// ============================================

export interface FilePreviewModalProps {
    /** File being previewed */
    file: FileItem | null;
    /** Blob URL for the file content */
    blobUrl: string | null;
    /** Text content for text/code files */
    textContent: string | null;
    /** Whether the modal is open */
    isOpen: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Close modal callback */
    onClose: () => void;
    /** Download file callback */
    onDownload?: (file: FileItem) => void;
}

// ============================================
// Sub-components
// ============================================

/** Renders the appropriate preview content based on file type */
const PreviewContent: FC<{
    file: FileItem;
    blobUrl: string | null;
    textContent: string | null;
}> = ({ file, blobUrl, textContent }) => {
    const previewType = getPreviewType(file.mimeType);

    // Image preview
    if (previewType === 'image' && blobUrl) {
        return (
            <img
                src={blobUrl}
                alt={file.originalName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
        );
    }

    // Video preview
    if (previewType === 'video' && blobUrl) {
        return (
            <video
                src={blobUrl}
                controls
                autoPlay={false}
                className="max-w-full max-h-[70vh] rounded-lg"
            >
                Your browser does not support video playback.
            </video>
        );
    }

    // Audio preview
    if (previewType === 'audio' && blobUrl) {
        return (
            <div className="w-full max-w-md p-6 bg-[#161B22] rounded-lg">
                <audio src={blobUrl} controls className="w-full">
                    Your browser does not support audio playback.
                </audio>
            </div>
        );
    }

    // PDF preview (iframe)
    if (previewType === 'pdf' && blobUrl) {
        return (
            <iframe
                src={blobUrl}
                title={file.originalName}
                className="w-full h-[75vh] md:h-[80vh] rounded-lg border border-[#30363D]"
            />
        );
    }

    // Text/code preview
    if (previewType === 'text' && textContent !== null) {
        return (
            <pre className="w-full max-h-[70vh] overflow-auto p-4 bg-[#0D1117] rounded-lg border border-[#30363D] text-sm text-[#C9D1D9] font-mono whitespace-pre-wrap break-all">
                {textContent}
            </pre>
        );
    }

    // Fallback: unsupported type
    return (
        <div className="text-center p-8 text-[#8B949E]">
            <p className="text-lg mb-2">Preview not available</p>
            <p className="text-sm">This file type cannot be previewed.</p>
        </div>
    );
};

// ============================================
// Main Component
// ============================================

export const FilePreviewModal: FC<FilePreviewModalProps> = ({
    file,
    blobUrl,
    textContent,
    isOpen,
    isLoading = false,
    onClose,
    onDownload,
}) => {
    // Close on Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && file && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    {/* Modal container */}
                    <motion.div
                        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#161B22] rounded-xl border border-[#30363D] shadow-2xl overflow-hidden"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] bg-[#0D1117]">
                            <h2
                                className="text-lg font-medium text-[#C9D1D9] truncate max-w-[70%]"
                                title={file.originalName}
                            >
                                {file.originalName}
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* Download button */}
                                {onDownload && (
                                    <button
                                        onClick={() => onDownload(file)}
                                        className="p-2 rounded-lg hover:bg-[#30363D] text-[#8B949E] hover:text-[#6BCB77] transition-colors"
                                        title="Download"
                                        aria-label="Download file"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                )}
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[#30363D] text-[#8B949E] hover:text-[#F85149] transition-colors"
                                    title="Close"
                                    aria-label="Close preview"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[#6BCB77] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <PreviewContent
                                    file={file}
                                    blobUrl={blobUrl}
                                    textContent={textContent}
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FilePreviewModal;
