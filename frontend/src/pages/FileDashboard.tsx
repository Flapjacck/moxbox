import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useFileBrowser } from '../features/files/hooks/useFileBrowser';
import { useFolders } from '../features/folders/hooks/useFolders';
import { FileListToolbar } from '../features/files/components/FileListToolbar';
import { FileCard } from '../features/files/components/FileCard';
import { Breadcrumbs, FolderCard, CreateFolderModal } from '../features/folders/components';
import { Loader2, Trash2, FolderPlus } from 'lucide-react';
import type { FileItem, ConflictPayload } from '../features/files/types/file.types';

/**
 * FileDashboard Page
 * ===================
 * Main page for viewing and managing user files with folder navigation.
 * Integrates with backend file/folder APIs via hooks.
 */
export const FileDashboard = () => {
  // View mode toggle (list or grid)
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Search pattern for filtering
  const [pattern, setPattern] = useState('');

  // Create folder modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // File browser hook (combined files + folders)
  const {
    currentPath,
    files,
    folders,
    breadcrumbs,
    isLoading,
    error,
    lastBatchResult,
    pendingBatchUpload,
    navigateTo,
    refresh,
    upload,
    uploadMultiple,
    resolveBatchConflict,
    cancelBatchUpload,
    download,
    remove,
    clearBatchResult,
  } = useFileBrowser();

  // Duplicate upload conflict state
  const [duplicateConflict, setDuplicateConflict] = useState<{ conflict: ConflictPayload | null; file: File } | null>(null);

  // Folder operations
  const { create: createFolder, remove: deleteFolder } = useFolders();

  // Filter files locally based on search pattern
  const filteredFiles = useMemo(() => {
    if (!pattern.trim()) return files;
    const lower = pattern.toLowerCase();
    return files.filter((f: FileItem) => f.originalName.toLowerCase().includes(lower));
  }, [files, pattern]);

  // Filter folders locally based on search pattern
  const filteredFolders = useMemo(() => {
    if (!pattern.trim()) return folders;
    const lower = pattern.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(lower));
  }, [folders, pattern]);

  // Handle file download
  const handleDownload = (file: FileItem) => download(file);

  // Handle file soft-delete
  const handleDelete = (file: FileItem) => remove(file);

  // Handle folder navigation
  const handleFolderClick = (path: string) => navigateTo(path);

  // Handle folder delete
  const handleFolderDelete = async (path: string) => {
    await deleteFolder(path);
    await refresh();
  };

  // Handle folder creation
  const handleCreateFolder = async (name: string) => {
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    await createFolder(newPath);
    await refresh();
  };

  // Handle duplicate detected by API: show modal
  const onDuplicate = (data: { conflict: ConflictPayload | null; file: File }) => {
    setDuplicateConflict(data);
  };

  const clearDuplicate = () => setDuplicateConflict(null);

  const handleResolveDuplicate = async (action: 'replace' | 'keep_both') => {
    if (!duplicateConflict) return;
    try {
      await upload(duplicateConflict.file, action);
      setDuplicateConflict(null);
      await refresh();
    } catch {
      // errors are handled by the hook (setError)
      setDuplicateConflict(null);
    }
  };

  const totalCount = filteredFiles.length + filteredFolders.length;

  return (
    <div className="min-h-screen bg-[#0D1117] p-6 text-slate-200">
      {/* Page header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Files</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <a
            href="/trash"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Trash
          </a>
        </div>
      </header>

      {/* Breadcrumb navigation */}
      <Breadcrumbs
        segments={breadcrumbs}
        onNavigate={navigateTo}
        className="mb-4"
      />

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

      {/* Batch upload result notification */}
      {lastBatchResult && (
        <motion.div
          className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <span>
              Uploaded {lastBatchResult.successCount} of {lastBatchResult.totalCount} files
              {lastBatchResult.failureCount > 0 && ` (${lastBatchResult.failureCount} failed)`}
            </span>
            <button
              onClick={clearBatchResult}
              className="text-blue-400 hover:text-blue-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Toolbar: search, view toggle, upload */}
      <FileListToolbar
        view={view}
        setView={setView}
        pattern={pattern}
        setPattern={setPattern}
        onUpload={upload}
        onUploadMultiple={uploadMultiple}
        onRefresh={refresh}
        count={totalCount}
        isUploading={isLoading}
        onDuplicate={onDuplicate}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#3D7BF0] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && totalCount === 0 && (
        <div className="text-center py-12 text-slate-400">
          {pattern ? 'No items match your search.' : 'This folder is empty.'}
        </div>
      )}

      {/* Content grid/list */}
      {!isLoading && totalCount > 0 && (
        <motion.div
          className={view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'flex flex-col gap-2'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Folders first */}
          {filteredFolders.map((folder) => (
            <FolderCard
              key={folder.name}
              name={folder.name}
              path={currentPath ? `${currentPath}/${folder.name}` : folder.name}
              variant={view}
              onClick={handleFolderClick}
              onDelete={handleFolderDelete}
            />
          ))}

          {/* Then files */}
          {filteredFiles.map((file: FileItem) => (
            <FileCard
              key={file.id}
              file={file}
              variant={view}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </motion.div>
      )}

      {/* Create folder modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={handleCreateFolder}
        currentPath={currentPath}
      />

      {/* Duplicate conflict modal (single file) */}
      {duplicateConflict && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#0B1220] rounded-lg p-6 w-96 border border-[#30363D]">
            <h3 className="text-lg font-semibold mb-2">Upload Conflict</h3>
            <p className="text-sm text-slate-300 mb-4">A file named <strong className="text-slate-100">{duplicateConflict.conflict?.originalName ?? duplicateConflict.file.name}</strong> already exists in this folder.</p>
            <div className="flex items-center gap-3 justify-end">
              <button className="px-3 py-1 rounded bg-[#161B22] text-slate-200" onClick={() => clearDuplicate()}>Cancel</button>
              <button className="px-3 py-1 rounded bg-[#2EA043] text-white" onClick={() => handleResolveDuplicate('keep_both')}>Keep both (rename)</button>
              <button className="px-3 py-1 rounded bg-[#E11D48] text-white" onClick={() => handleResolveDuplicate('replace')}>Replace</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch upload conflict modal (multiple files) */}
      {pendingBatchUpload && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#0B1220] rounded-lg p-6 w-md border border-[#30363D]">
            <h3 className="text-lg font-semibold mb-2">Upload Conflicts</h3>
            <p className="text-sm text-slate-300 mb-3">
              {pendingBatchUpload.conflicts.length} of {pendingBatchUpload.totalFiles} files already exist:
            </p>
            <ul className="text-sm text-slate-400 mb-4 max-h-32 overflow-y-auto bg-[#161B22] rounded p-2">
              {pendingBatchUpload.conflicts.map((c, i) => (
                <li key={i} className="truncate py-0.5">
                  • <span className="text-slate-200">{c.originalName}</span>
                  {c.folder && <span className="text-slate-500 ml-1">in {c.folder}</span>}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mb-4">
              Choose an action to apply to all conflicting files:
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                className="px-3 py-1.5 rounded bg-[#161B22] text-slate-200 hover:bg-[#21262D] transition-colors"
                onClick={cancelBatchUpload}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded bg-[#2EA043] text-white hover:bg-[#3FB950] transition-colors"
                onClick={() => resolveBatchConflict('keep_both')}
              >
                Keep both (rename)
              </button>
              <button
                className="px-3 py-1.5 rounded bg-[#E11D48] text-white hover:bg-[#F43F5E] transition-colors"
                onClick={() => resolveBatchConflict('replace')}
              >
                Replace all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDashboard;
