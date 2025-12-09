/**
 * FileDashboard Page
 * ===================
 * Main page for viewing and managing user files with folder navigation.
 * Integrates with backend file/folder APIs via hooks.
 *
 * Refactored to use subcomponents for modals, notifications, and grid.
 */

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useFileBrowser } from '../features/files/hooks/useFileBrowser';
import { useFolders } from '../features/folders/hooks/useFolders';
import { FileListToolbar } from '../features/files/components/FileListToolbar';
import { Breadcrumbs, CreateFolderModal } from '../features/folders/components';
import { FileDashboardHeader } from '../features/files/components/FileDashboardHeader';
import { ErrorNotification } from '../features/files/components/ErrorNotification';
import { BatchUploadNotification } from '../features/files/components/BatchUploadNotification';
import { UploadProgressBar } from '../features/files/components/UploadProgressBar';
import { DuplicateConflictModal } from '../features/files/components/DuplicateConflictModal';
import { BatchUploadConflictModal } from '../features/files/components/BatchUploadConflictModal';
import { FilePreviewModal } from '../features/files/components/FilePreviewModal';
import { FileGrid } from '../features/files/components/FileGrid';
import { downloadFileById } from '../features/files/services/fileService';
import { getPreviewType } from '../utils';
import type { FileItem, ConflictPayload } from '../features/files/types/file.types';

// ============================================
// Types
// ============================================

/** State for file preview modal */
interface PreviewState {
  file: FileItem;
  blobUrl: string | null;
  textContent: string | null;
  isLoading: boolean;
}

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

  // File preview state
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);

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
    uploadProgress,
    navigateTo,
    refresh,
    upload,
    uploadMultiple,
    resolveBatchConflict,
    cancelUpload,
    cancelBatchUpload,
    download,
    remove,
    clearBatchResult,
    clearError: clearFileError,
  } = useFileBrowser();

  // Folder operations
  const { create: createFolder, remove: deleteFolder, error: foldersError, clearError: clearFoldersError } = useFolders();

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

  // Get root folder size
  const rootSize = useMemo(() => {
    // When in root (empty path), find folder entry for root or sum all top-level folder sizes
    if (currentPath === '' || currentPath === '/') {
      // Sum sizes of all folders in root (representing total space used)
      return folders.reduce((acc, folder) => acc + (folder.size ?? 0), 0);
    }
    return undefined;
  }, [folders, currentPath]);

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

  // Preview file handler - fetches blob and opens modal
  const handlePreview = useCallback(async (file: FileItem) => {
    // Set loading state immediately
    setPreviewState({ file, blobUrl: null, textContent: null, isLoading: true });

    try {
      const blob = await downloadFileById(file.id);
      const previewType = getPreviewType(file.mimeType);

      if (previewType === 'text') {
        // For text files, read as text
        const text = await blob.text();
        setPreviewState({ file, blobUrl: null, textContent: text, isLoading: false });
      } else {
        // For binary files (image, video, audio, pdf), create blob URL
        const url = URL.createObjectURL(blob);
        setPreviewState({ file, blobUrl: url, textContent: null, isLoading: false });
      }
    } catch (err) {
      console.error('Preview failed:', err);
      setPreviewState(null);
    }
  }, []);

  // Close preview and cleanup blob URL
  const handleClosePreview = useCallback(() => {
    if (previewState?.blobUrl) {
      URL.revokeObjectURL(previewState.blobUrl);
    }
    setPreviewState(null);
  }, [previewState]);

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
      <FileDashboardHeader onCreateFolder={() => setShowCreateFolder(true)} rootSize={rootSize} />

      {/* Breadcrumbs */}
      <Breadcrumbs segments={breadcrumbs} onNavigate={navigateTo} className="mb-4" />

      {/* Error notification */}
      {(error || foldersError) && (
        <ErrorNotification
          message={error || foldersError || ''}
          onDismiss={error ? clearFileError : clearFoldersError}
        />
      )}

      {/* Upload progress bar */}
      {uploadProgress.isUploading && (
        <div className="mb-4">
          <UploadProgressBar progress={uploadProgress} onCancel={cancelUpload} />
        </div>
      )}

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
        isUploading={uploadProgress.isUploading}
        onDuplicate={onDuplicate}
      />

      {/* Loading state */}
      {isLoading && !uploadProgress.isUploading && (
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
          onPreview={handlePreview}
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

      {/* File preview modal */}
      <FilePreviewModal
        file={previewState?.file ?? null}
        blobUrl={previewState?.blobUrl ?? null}
        textContent={previewState?.textContent ?? null}
        isOpen={previewState !== null}
        isLoading={previewState?.isLoading ?? false}
        onClose={handleClosePreview}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default FileDashboard;
