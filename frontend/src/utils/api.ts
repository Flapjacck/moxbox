export type ApiError = Error & { status?: number; payload?: unknown };

export const isApiError = (v: unknown): v is ApiError => {
    return typeof v === 'object' && v !== null && 'status' in (v as Record<string, unknown>);
};
