import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useFiles } from '../features/files/hooks/useFiles';
import { FileListToolbar } from '../features/files/components/FileListToolbar';
import { FileCard } from '../features/files/components/FileCard';
import { Loader2 } from 'lucide-react';

/**
 * FileDashboard Page
 * ===================
 * Main page for viewing and managing user files.
 * Integrates with backend file API via useFiles hook.
 */
export const FileDashboard = () => {
  // View mode toggle (list or grid)
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Search pattern for filtering files
  const [pattern, setPattern] = useState('');

  // File operations hook
  const { files, isLoading, error, fetchFiles, upload, download, remove } = useFiles();

  // Filter files locally based on search pattern
  const filteredFiles = useMemo(() => {
    if (!pattern.trim()) return files;
    const lower = pattern.toLowerCase();
    return files.filter((f) => f.toLowerCase().includes(lower));
  }, [files, pattern]);

  return (
    <div className="min-h-screen bg-[#0D1117] p-6 text-slate-200">
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">My Files</h1>
      </header>

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

      {/* Toolbar: search, view toggle, upload */}
      <FileListToolbar
        view={view}
        setView={setView}
        pattern={pattern}
        setPattern={setPattern}
        onUpload={upload}
        onRefresh={() => fetchFiles()}
        count={filteredFiles.length}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#3D7BF0] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredFiles.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          {pattern ? 'No files match your search.' : 'No files uploaded yet.'}
        </div>
      )}

      {/* File grid/list */}
      {!isLoading && filteredFiles.length > 0 && (
        <motion.div
          className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-2'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredFiles.map((filename) => (
            <FileCard
              key={filename}
              fileName={filename}
              variant={view}
              onDownload={() => download(filename)}
              onDelete={() => remove(filename)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FileDashboard;
