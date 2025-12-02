import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useFileBrowser } from '../features/files/hooks/useFileBrowser';
import { useFolders } from '../features/folders/hooks/useFolders';
import { FileListToolbar } from '../features/files/components/FileListToolbar';
import { FileCard } from '../features/files/components/FileCard';
import { Breadcrumbs, FolderCard, CreateFolderModal } from '../features/folders/components';
import { Loader2, Trash2, FolderPlus } from 'lucide-react';
import type { FileItem } from '../features/files/types/file.types';

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
    navigateTo,
    refresh,
    upload,
    download,
    remove,
  } = useFileBrowser();

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

      {/* Toolbar: search, view toggle, upload */}
      <FileListToolbar
        view={view}
        setView={setView}
        pattern={pattern}
        setPattern={setPattern}
        onUpload={upload}
        onRefresh={refresh}
        count={totalCount}
        isUploading={isLoading}
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
    </div>
  );
};

export default FileDashboard;
