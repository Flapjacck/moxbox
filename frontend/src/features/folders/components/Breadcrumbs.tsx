import { ChevronRight, Home } from 'lucide-react';
import type { FC } from 'react';
import type { BreadcrumbSegment } from '../types/folder.types';

/**
 * Breadcrumbs Props
 */
interface BreadcrumbsProps {
    /** Array of breadcrumb segments */
    segments: BreadcrumbSegment[];
    /** Callback when a breadcrumb is clicked */
    onNavigate: (path: string) => void;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Breadcrumbs Component
 * =====================
 * Displays folder navigation breadcrumbs with clickable segments.
 * Shows home icon for root, with chevrons between segments.
 */
export const Breadcrumbs: FC<BreadcrumbsProps> = ({
    segments,
    onNavigate,
    className = '',
}) => {
    return (
        <nav
            className={`flex items-center gap-1 text-sm text-slate-400 ${className}`}
            aria-label="Breadcrumb"
        >
            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const isHome = index === 0;

                return (
                    <div key={segment.path || 'root'} className="flex items-center gap-1">
                        {/* Separator (not before first item) */}
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}

                        {/* Breadcrumb button */}
                        <button
                            onClick={() => onNavigate(segment.path)}
                            disabled={isLast}
                            className={`
                                flex items-center gap-1 px-1.5 py-0.5 rounded
                                ${isLast
                                    ? 'text-slate-200 cursor-default'
                                    : 'hover:bg-[#161B22] hover:text-slate-200 transition-colors'
                                }
                            `}
                        >
                            {isHome && <Home className="w-4 h-4" />}
                            <span>{segment.name}</span>
                        </button>
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
