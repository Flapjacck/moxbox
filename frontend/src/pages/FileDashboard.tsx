/**
 * FileDashboard Page
 * ===================
 * Main page for viewing and managing user files with folder navigation.
 * Integrates with backend file/folder APIs via hooks.
 *
 * Refactored to use subcomponents for modals, notifications, and grid.
 */

import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useFileBrowser } from '../features/files/hooks/useFileBrowser';
import { useFolders } from '../features/folders/hooks/useFolders';
import { FileListToolbar } from '../features/files/components/FileListToolbar';
import { Breadcrumbs, CreateFolderModal } from '../features/folders/components';
import { FileDashboardHeader } from '../features/files/components/FileDashboardHeader';
import { ErrorNotification } from '../features/files/components/ErrorNotification';
import { BatchUploadNotification } from '../features/files/components/BatchUploadNotification';
import { DuplicateConflictModal } from '../features/files/components/DuplicateConflictModal';
import { BatchUploadConflictModal } from '../features/files/components/BatchUploadConflictModal';
import { FileGrid } from '../features/files/components/FileGrid';
import type { FileItem, ConflictPayload } from '../features/files/types/file.types';

// ============================================
// Component
// ============================================

export const FileDashboard = () => {
  // View mode toggle (list or grid)
  const [view, setView] = useState<'list' | 'grid'>('grid');

  // Search pattern for filtering
  const [pattern, setPattern] = useState('');

  // Create folder modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Duplicate upload conflict state
  const [duplicateConflict, setDuplicateConflict] = useState<{
    conflict: ConflictPayload | null;
    file: File;
  } | null>(null);

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

  // Folder operations
  const { create: createFolder, remove: deleteFolder } = useFolders();

  // ----------------------------------------
  // Filtering
  // ----------------------------------------

  const filteredFiles = useMemo(() => {
    if (!pattern.trim()) return files;
    const lower = pattern.toLowerCase();
    return files.filter((f: FileItem) =>
      f.originalName.toLowerCase().includes(lower)
    );
  }, [files, pattern]);

  const filteredFolders = useMemo(() => {
    if (!pattern.trim()) return folders;
    const lower = pattern.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(lower));
  }, [folders, pattern]);

  const totalCount = filteredFiles.length + filteredFolders.length;

  // ----------------------------------------
  // Handlers
  // ----------------------------------------

  const handleDownload = (file: FileItem) => download(file);
  const handleDelete = (file: FileItem) => remove(file);
  const handleFolderClick = (path: string) => navigateTo(path);

  const handleFolderDelete = async (path: string) => {
    await deleteFolder(path);
    await refresh();
  };

  const handleCreateFolder = async (name: string) => {
    const newPath = currentPath ? `${currentPath}/${name}` : name;
    await createFolder(newPath);
    await refresh();
  };

  // Duplicate conflict handlers
  const onDuplicate = (data: { conflict: ConflictPayload | null; file: File }) => {
    setDuplicateConflict(data);
  };

  const handleResolveDuplicate = async (action: 'replace' | 'keep_both') => {
    if (!duplicateConflict) return;
    try {
      await upload(duplicateConflict.file, action);
      setDuplicateConflict(null);
      await refresh();
    } catch {
      setDuplicateConflict(null);
    }
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div className="min-h-screen bg-[#0D1117] p-6 text-slate-200">
      {/* Header */}
      <FileDashboardHeader onCreateFolder={() => setShowCreateFolder(true)} />

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbs} onNavigate={navigateTo} className="mb-4" />

      {/* Error notification */}
      {error && <ErrorNotification message={error} />}

      {/* Batch upload result */}
      {lastBatchResult && (
        <BatchUploadNotification result={lastBatchResult} onDismiss={clearBatchResult} />
      )}

      {/* Toolbar */}
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

      {/* File/folder grid */}
      {!isLoading && totalCount > 0 && (
        <FileGrid
          currentPath={currentPath}
          files={filteredFiles}
          folders={filteredFolders}
          view={view}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onFolderClick={handleFolderClick}
          onFolderDelete={handleFolderDelete}
        />
      )}

      {/* Create folder modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreate={handleCreateFolder}
        currentPath={currentPath}
      />

      {/* Single file conflict modal */}
      {duplicateConflict && (
        <DuplicateConflictModal
          conflict={duplicateConflict.conflict}
          file={duplicateConflict.file}
          onResolve={handleResolveDuplicate}
          onCancel={() => setDuplicateConflict(null)}
        />
      )}

      {/* Batch conflict modal */}
      {pendingBatchUpload && (
        <BatchUploadConflictModal
          conflicts={pendingBatchUpload.conflicts}
          totalFiles={pendingBatchUpload.totalFiles}
          onResolve={resolveBatchConflict}
          onCancel={cancelBatchUpload}
        />
      )}
    </div>
  );
};

export default FileDashboard;
