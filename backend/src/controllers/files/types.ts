/** Result for a single file in a batch upload */
export interface BatchFileResult {
    originalName: string;
    storagePath: string;
    success: boolean;
    message: string;
    fileId?: string;
    error?: string;
}

/** Conflict info for a file that already exists */
export interface ConflictInfo {
    originalName: string;
    existingFileId: string;
    folder: string;
}

/** Batch upload response structure */
export interface BatchUploadResponse {
    message: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    results: BatchFileResult[];
}

/** Conflict response when files need user action */
export interface ConflictResponse {
    message: string;
    conflicts?: ConflictInfo[];
    trashedConflicts?: string[];
    totalFiles?: number;
}
