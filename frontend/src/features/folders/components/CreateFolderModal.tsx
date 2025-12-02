import { useState, type FC, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { FolderPlus, X } from 'lucide-react';

/**
 * CreateFolderModal Props
 */
interface CreateFolderModalProps {
    /** Whether modal is visible */
    isOpen: boolean;
    /** Close modal callback */
    onClose: () => void;
    /** Create folder callback */
    onCreate: (name: string) => Promise<void>;
    /** Current folder path (for context display) */
    currentPath?: string;
}

/**
 * CreateFolderModal Component
 * ===========================
 * Modal dialog for creating a new folder.
 * Validates folder name and handles creation.
 */
export const CreateFolderModal: FC<CreateFolderModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    currentPath = '',
}) => {
    const [name, setName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    const handleClose = () => {
        setName('');
        setError(null);
        onClose();
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate name
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Folder name is required');
            return;
        }

        // Check for invalid characters
        if (/[<>:"/\\|?*]/.test(trimmedName)) {
            setError('Folder name contains invalid characters');
            return;
        }

        setIsCreating(true);
        try {
            await onCreate(trimmedName);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create folder');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
                className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 max-w-md w-full mx-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-[#58A6FF]" />
                        New Folder
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-[#0D1117] rounded text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Current location */}
                {currentPath && (
                    <div className="text-xs text-slate-500 mb-3">
                        Creating in: /{currentPath}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Folder name"
                        className="w-full bg-[#0B1220] border border-[#30363D] px-3 py-2 rounded text-slate-100 focus:border-[#58A6FF] focus:outline-none"
                        autoFocus
                        disabled={isCreating}
                    />

                    {/* Error message */}
                    {error && (
                        <div className="text-red-400 text-sm mt-2">{error}</div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end mt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-3 py-1.5 rounded bg-[#0F1724] text-slate-300 hover:bg-[#1C2128]"
                            disabled={isCreating}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 rounded bg-[#238636] text-white hover:bg-[#2EA043] disabled:opacity-50"
                            disabled={isCreating || !name.trim()}
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateFolderModal;
