import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrash } from '../features/files/hooks/useTrash';
import { FileCard } from '../features/files/components/FileCard';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import type { FileItem } from '../features/files/types/file.types';

/** Location state passed from FileDashboard when navigating to trash */
interface TrashLocationState {
  from?: string;
}

/**
 * Trash Page
 * ===========
 * Page for viewing and managing soft-deleted (trashed) files.
 * Allows restoring files to original location or permanently deleting them.
 */
export const Trash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the folder path user came from (for back navigation)
  const fromPath = (location.state as TrashLocationState)?.from || '';
  
  // View mode toggle (list or grid)
  const [view, setView] = useState<'list' | 'grid'>('list');

  // Search pattern for filtering trashed files
  const [pattern, setPattern] = useState('');

  // Confirmation modal state for empty trash
  const [showConfirm, setShowConfirm] = useState(false);

  // Trash operations hook
  const {
    trashedFiles,
    isLoading,
    error,
    fetchTrashedFiles,
    restore,
    permanentDelete,
    emptyTrash,
  } = useTrash();

  // Filter trashed files locally based on search pattern
  const filteredFiles = useMemo(() => {
    if (!pattern.trim()) return trashedFiles;
    const lower = pattern.toLowerCase();
    return trashedFiles.filter((f: FileItem) =>
      f.originalName.toLowerCase().includes(lower)
    );
  }, [trashedFiles, pattern]);

  // Handle restore action - navigate to original folder after restore
  const handleRestore = async (file: FileItem) => {
    await restore(file);
    // Extract folder path from storagePath (remove filename)
    const folderPath = file.storagePath.split('/').slice(0, -1).join('/');
    // Navigate to original location with path param
    if (folderPath) {
      navigate(`/files?path=${encodeURIComponent(folderPath)}`);
    } else {
      navigate('/files');
    }
  };

  // Handle permanent delete action
  const handlePermanentDelete = (file: FileItem) => permanentDelete(file);

  // Handle empty trash with confirmation
  const handleEmptyTrash = async () => {
    setShowConfirm(false);
    await emptyTrash();
  };

  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 text-slate-200">
      {/* Page header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Navigate back to the folder user was in, or root if none specified
              if (fromPath) {
                navigate(`/files?path=${encodeURIComponent(fromPath)}`);
              } else {
                navigate('/files');
              }
            }}
            className="p-2 rounded hover:bg-[#161B22] transition-colors"
            title="Back to files"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Trash
          </h1>
        </div>
        {trashedFiles.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm w-full sm:w-auto"
          >
            Empty Trash
          </button>
        )}
      </header>

      {/* Confirmation modal for empty trash */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-[#161B22] border border-[#30363D] rounded-lg p-6 max-w-sm w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-lg font-semibold mb-2">Empty Trash?</h2>
            <p className="text-sm text-slate-400 mb-4">
              This will permanently delete all {trashedFiles.length} files in the
              trash. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 rounded bg-[#0F1724] text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-3 py-1 rounded bg-red-500 text-white"
              >
                Delete All
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Error message display */}
      {error && (
        <motion.div
          className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Simple toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          placeholder="Search trash"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="bg-[#0B1220] border border-[#22262b] px-3 py-1 rounded text-slate-100 flex-1 sm:w-64"
        />
        <button
          onClick={() => fetchTrashedFiles()}
          className="px-3 py-1 rounded bg-[#0f1724] text-slate-400 shrink-0"
        >
          Refresh
        </button>
        <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
          <span className="text-sm text-slate-400">{filteredFiles.length} files</span>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded text-sm shrink-0 ${view === 'list' ? 'bg-[#111827]' : 'bg-transparent'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded text-sm shrink-0 ${view === 'grid' ? 'bg-[#111827]' : 'bg-transparent'}`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#3D7BF0] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredFiles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {pattern ? 'No files match your search.' : 'Trash is empty.'}
        </div>
      )}

      {/* Trashed files grid/list */}
      {!isLoading && filteredFiles.length > 0 && (
        <motion.div
          className={
            view === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'flex flex-col gap-2'
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredFiles.map((file: FileItem) => (
            <FileCard
              key={file.id}
              file={file}
              variant={view}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Trash;