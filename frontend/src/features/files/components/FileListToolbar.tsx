import type { FC } from 'react';
import { List, Grid, RefreshCw } from 'lucide-react';
import { UploadButton } from '../../../components/UploadButton';

/**
 * FileListToolbar Props
 */
interface FileListToolbarProps {
	/** Current view mode */
	view: 'list' | 'grid';
	/** View mode setter */
	setView: (v: 'list' | 'grid') => void;
	/** Search pattern value */
	pattern: string;
	/** Search pattern setter */
	setPattern: (s: string) => void;
	/** Upload callback - receives file to upload */
	onUpload?: (file: File) => Promise<void> | void;
	/** Refresh callback */
	onRefresh?: () => void;
	/** Item count to display */
	count?: number;
	/** Whether upload is disabled */
	isUploading?: boolean;
}

/**
 * FileListToolbar Component
 * =========================
 * Toolbar for file dashboard with search, view toggle, and upload.
 * Delegates actual operations to parent via props.
 */
export const FileListToolbar: FC<FileListToolbarProps> = ({
	view,
	setView,
	pattern,
	setPattern,
	onUpload,
	onRefresh,
	count,
	isUploading = false,
}) => {
	return (
		<div className="flex items-center gap-3 mb-4 flex-wrap">
			{/* Search input */}
			<div className="flex items-center gap-2">
				<input
					placeholder="Search files..."
					value={pattern}
					onChange={(e) => setPattern(e.target.value)}
					className="bg-[#0B1220] border border-[#30363D] px-3 py-1.5 rounded text-slate-100 w-64 text-sm focus:border-[#58A6FF] focus:outline-none"
				/>
				<button
					onClick={() => onRefresh?.()}
					className="p-1.5 rounded bg-[#0F1724] text-slate-400 hover:text-slate-200 hover:bg-[#161B22] transition-colors"
					title="Refresh"
				>
					<RefreshCw className="w-4 h-4" />
				</button>
			</div>

			{/* Right side controls */}
			<div className="ml-auto flex items-center gap-3">
				{/* Item count */}
				{typeof count === 'number' && (
					<div className="text-sm text-slate-500">
						{count} {count === 1 ? 'item' : 'items'}
					</div>
				)}

				{/* View toggle */}
				<div className="flex items-center gap-1 bg-[#0F1724] rounded p-0.5">
					<button
						onClick={() => setView('list')}
						aria-label="List view"
						className={`p-1.5 rounded transition-colors ${
							view === 'list'
								? 'bg-[#161B22] text-slate-200'
								: 'text-slate-500 hover:text-slate-300'
						}`}
					>
						<List className="w-4 h-4" />
					</button>
					<button
						onClick={() => setView('grid')}
						aria-label="Grid view"
						className={`p-1.5 rounded transition-colors ${
							view === 'grid'
								? 'bg-[#161B22] text-slate-200'
								: 'text-slate-500 hover:text-slate-300'
						}`}
					>
						<Grid className="w-4 h-4" />
					</button>
				</div>

				{/* Upload button */}
				{onUpload && (
					<UploadButton
						onUpload={onUpload}
						disabled={isUploading}
						label={isUploading ? 'Uploading...' : 'Upload'}
					/>
				)}
			</div>
		</div>
	);
};

export default FileListToolbar;
