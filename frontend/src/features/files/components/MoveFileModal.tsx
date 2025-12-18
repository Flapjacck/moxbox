/**
 * MoveFileModal
 * ==============
 * Modal for selecting a destination folder to move a file to.
 * Allows drilling down into folders to explore nested directories.
 */

import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Loader2, FolderOpen } from 'lucide-react';
import { listFolderContents } from '../../folders/services/folderService';
import type { FileItem } from '../types/file.types';
import type { DirectoryEntry } from '../../folders/types/folder.types';

// ============================================
// Types
// ============================================

export interface MoveFileModalProps {
  file: FileItem;
  currentPath: string;
  folders: DirectoryEntry[];
  onMove: (destinationPath: string) => Promise<void>;
  onCancel: () => void;
}

// ============================================
// Component
// ============================================

/**
 * Modal to select destination folder for moving a file.
 * Interactive - allows drilling down into folders to browse nested directories.
 */
export const MoveFileModal = ({
  file,
  currentPath,
  folders,
  onMove,
  onCancel,
}: MoveFileModalProps) => {
  const [browsePath, setBrowsePath] = useState('');
  const [browsefolders, setBrowsefolders] = useState<DirectoryEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load root folders on mount
  useEffect(() => {
    const loadRootFolders = async () => {
      try {
        const response = await listFolderContents('');
        const rootFolders = response.contents.filter((e) => e.type === 'folder');
        setBrowsefolders(rootFolders);
      } catch (err) {
        console.error('Failed to load root folders:', err);
        setBrowsefolders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRootFolders();
  }, []);

  // Load subfolders when browsing into a folder
  const handleDrillDown = useCallback(async (folderName: string) => {
    const newPath = browsePath ? `${browsePath}/${folderName}` : folderName;
    setIsLoading(true);
    try {
      const response = await listFolderContents(newPath);
      const subfolders = response.contents.filter((e) => e.type === 'folder');
      setBrowsePath(newPath);
      setBrowsefolders(subfolders);
      setSelectedPath(newPath);
    } catch (err) {
      console.error('Failed to load folder contents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [browsePath]);

  // Navigate back to parent folder
  const handleGoBack = useCallback(async () => {
    if (!browsePath) return;
    const parts = browsePath.split('/');
    parts.pop();
    const parentPath = parts.join('/');

    setIsLoading(true);
    try {
      const response = await listFolderContents(parentPath);
      const subfolders = response.contents.filter((e) => e.type === 'folder');
      setBrowsePath(parentPath);
      setBrowsefolders(subfolders);
      setSelectedPath(parentPath);
    } catch (err) {
      console.error('Failed to load parent folder:', err);
    } finally {
      setIsLoading(false);
    }
  }, [browsePath]);

  const handleMove = async () => {
    setIsMoving(true);
    try {
      await onMove(selectedPath);
    } catch (err: any) {
      // Let caller handle errors (409 conflicts, etc)
      setIsMoving(false);
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-[#0B1220] rounded-lg p-6 w-[600px] h-[600px] border border-[#30363D] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-100">
            Move File
          </h3>
          <p className="text-xs text-slate-400 truncate mt-1">
            {file.originalName}
          </p>
        </div>

        {/* Current location info - compact */}
        <div className="mb-3 p-2 bg-[#161B22] rounded border border-[#21262D]">
          <div className="text-xs text-slate-500 mb-0.5">From</div>
          <div className="text-sm text-slate-300 truncate">{currentPath || '(root)'}</div>
        </div>

        {/* Main folder browser - emphasis here */}
        <div className="mb-3 flex-1 overflow-hidden flex flex-col">
          <label className="text-sm font-semibold text-slate-300 block mb-2">
            Select Destination Folder
          </label>
          <div className="flex-1 overflow-y-auto border border-[#30363D] rounded bg-[#0B1220] p-2 space-y-1">
            {/* Root option */}
            <button
              onClick={() => {
                setBrowsePath('');
                setBrowsefolders(folders);
                setSelectedPath('');
              }}
              disabled={isLoading}
              className={`w-full text-left px-3 py-2.5 rounded text-sm transition-colors font-medium ${
                selectedPath === ''
                  ? 'bg-[#2EA043] text-white'
                  : 'bg-[#161B22] text-slate-300 hover:bg-[#21262D] disabled:opacity-50'
              }`}
            >
              📁 (root)
            </button>

            {/* Current browsing path breadcrumb */}
            {browsePath && (
              <button
                onClick={handleGoBack}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 rounded text-xs bg-[#21262D] text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" />
                ← Back to {browsePath.split('/').slice(0, -1).join('/') || 'root'}
              </button>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}

            {/* Subfolders */}
            {!isLoading && browsefolders.map((folder) => {
              const folderPath = browsePath
                ? `${browsePath}/${folder.name}`
                : folder.name;

              return (
                <div key={folder.name} className="flex items-center gap-1 group">
                  <button
                    onClick={() => {
                      setSelectedPath(folderPath);
                    }}
                    className={`flex-1 text-left px-3 py-2.5 rounded text-sm transition-colors flex items-center gap-2 font-medium ${
                      selectedPath === folderPath
                        ? 'bg-[#2EA043] text-white'
                        : 'bg-[#161B22] text-slate-300 hover:bg-[#21262D]'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    {folder.name}
                  </button>
                  <button
                    onClick={() => handleDrillDown(folder.name)}
                    disabled={isLoading}
                    title="Explore subfolder"
                    className="px-2 py-2.5 rounded hover:bg-[#21262D] text-slate-400 hover:text-slate-300 disabled:opacity-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {/* Empty state */}
            {!isLoading && browsefolders.length === 0 && (
              <div className="text-xs text-slate-500 px-3 py-2">
                No subfolders in this directory
              </div>
            )}
          </div>
        </div>

        {/* Selected destination display - compact */}
        <div className="mb-4 p-2 bg-[#161B22] rounded border border-[#21262D]">
          <div className="text-xs text-slate-500 mb-0.5">To</div>
          <div className="text-sm text-slate-300 truncate">{selectedPath || '(root)'}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            disabled={isMoving || isLoading}
            className="px-4 py-2 rounded bg-[#161B22] text-slate-200 hover:bg-[#21262D] disabled:opacity-50 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            disabled={isMoving || isLoading || selectedPath === currentPath}
            className="px-4 py-2 rounded bg-[#2EA043] text-white hover:bg-[#3FB950] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
            onClick={handleMove}
          >
            {isMoving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveFileModal;
