import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { UploadCloud, List, Grid } from 'lucide-react';

/**
 * FileListToolbar
 * Small toolbar used on the file dashboard. Visual only and delegates
 * actual data operations to parent components via props.
 */
export const FileListToolbar = ({
	view,
	setView,
	pattern,
	setPattern,
	onUpload,
	onRefresh,
	count,
}: {
	view: 'list' | 'grid';
	setView: (v: 'list' | 'grid') => void;
	pattern: string;
	setPattern: (s: string) => void;
	onUpload?: (file: File) => Promise<void> | void;
	onRefresh?: () => void;
	count?: number;
}) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		const file = files[0];
		if (onUpload) await onUpload(file);
		// Reset input to allow re-uploading same file if desired
		e.currentTarget.value = '';
	};

	return (
		<div className="flex items-center gap-3 mb-4">
			<div className="flex items-center gap-2">
				<input
					placeholder="Search files"
					value={pattern}
					onChange={(e) => setPattern(e.target.value)}
					className="bg-[#0B1220] border border-[#22262b] px-3 py-1 rounded text-slate-100 w-64"
				/>
				<button onClick={() => onRefresh?.()} className="px-3 py-1 rounded bg-[#0f1724] text-slate-400">Refresh</button>
			</div>

			<div className="ml-auto flex items-center gap-2">
				{typeof count === 'number' && <div className="text-sm text-slate-400 mr-2">{count} files</div>}
				<div className="flex items-center gap-1">
					<button onClick={() => setView('list')} aria-label="List view" className={`p-2 rounded ${view === 'list' ? 'bg-[#111827]' : 'bg-transparent'}`}>
						<List className="w-5 h-5 text-slate-400" />
					</button>
					<button onClick={() => setView('grid')} aria-label="Grid view" className={`p-2 rounded ${view === 'grid' ? 'bg-[#111827]' : 'bg-transparent'}`}>
						<Grid className="w-5 h-5 text-slate-400" />
					</button>
				</div>

				<div>
					<button
						className="flex items-center gap-2 px-3 py-1 rounded bg-[#0F1724] text-slate-200"
						onClick={() => fileInputRef.current?.click()}
					>
						<UploadCloud className="w-4 h-4" /> Upload
					</button>
					<input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
				</div>
			</div>
		</div>
	);
};

export default FileListToolbar;
