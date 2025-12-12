import { Request, Response } from 'express';
import path from 'path';
import { isUploadAborted } from '../../middleware/uploadTracker';
import * as fileStorage from '../../utils/fileStorage';
import { computeSha256 } from '../../utils/fileHash';
import { ValidationError } from '../../middleware/errors';
import { info } from '../../utils/logger';
import {
    createFile,
    getDeletedFileByOriginalNameAndFolder,
    getActiveFileByOriginalNameAndFolder,
    generateUniqueOriginalNameInFolder,
    updateFile,
} from '../../models/files';
import { ensureAndRecalculateFolderSizes } from '../../utils/folderSizeUtil';

/**
 * POST /api/files/upload
 * Upload a single file to storage, optionally in a subdirectory.
 * Handles conflict detection and resolution via action param.
 * Recalculates folder size on successful upload.
 */
export async function uploadFile(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new ValidationError('No file provided');

    const sanitizedFolder = (req as any).sanitizedFolder as string || '';
    const storagePath = sanitizedFolder
        ? path.posix.join(sanitizedFolder, file.filename)
        : file.filename;

    info('File uploaded — checking for conflicts', {
        filename: file.filename,
        originalName: file.originalname,
        folder: sanitizedFolder || '(root)',
    });

    // If the upload was aborted by the client, abort processing and clean up
    if (isUploadAborted(req)) {
        try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
        return res.status(499).json({ message: 'Upload cancelled' });
    }

    // Check for trashed file conflict
    const trashedConflict = getDeletedFileByOriginalNameAndFolder(file.originalname, sanitizedFolder || null);
    if (trashedConflict) {
        try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
        throw new ValidationError(
            `Upload blocked: '${file.originalname}' exists in Trash. Restore or delete it first.`
        );
    }

    // Check for active file conflict
    const activeConflict = getActiveFileByOriginalNameAndFolder(file.originalname, sanitizedFolder || null);
    const action = req.body?.action as 'replace' | 'keep_both' | undefined;

    // Return 409 if conflict and no action specified
    if (activeConflict && !action) {
        try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
        return res.status(409).json({
            message: `A file named '${file.originalname}' already exists.`,
            conflict: { id: activeConflict.id, originalName: activeConflict.original_name },
        });
    }

    try {
        const absolutePath = fileStorage.getFilePath(storagePath);
        const sha256 = await computeSha256(absolutePath);

        // Handle replace action
        if (action === 'replace' && activeConflict) {
            const oldStorage = activeConflict.storage_path;
            const updated = updateFile(activeConflict.id, {
                stored_name: file.filename,
                mime_type: file.mimetype,
                size: file.size,
                hash_sha256: sha256,
                storage_path: storagePath,
                owner_id: req.user?.id ?? null,
            });
            if (oldStorage && oldStorage !== storagePath) {
                try { await fileStorage.deleteFile(oldStorage); } catch { /* ignore */ }
            }
            // Recalculate folder sizes after replace (including root folder)
            ensureAndRecalculateFolderSizes(sanitizedFolder, req.user?.id ?? null);
            return res.status(200).json({ message: 'File replaced', file: updated });
        }

        // Handle keep_both or new file
        let displayName = file.originalname;
        if (action === 'keep_both' && activeConflict) {
            displayName = generateUniqueOriginalNameInFolder(file.originalname, sanitizedFolder || null);
        }

        const created = createFile({
            originalName: displayName,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            hashSha256: sha256,
            storagePath,
            ownerId: req.user?.id ?? null,
            isPublic: false,
        });

        // Recalculate folder sizes after successful upload (including root folder)
        ensureAndRecalculateFolderSizes(sanitizedFolder, req.user?.id ?? null);

        return res.status(201).json({ message: 'File uploaded', file: created });
    } catch (err) {
        try { await fileStorage.deleteFile(storagePath); } catch { /* ignore */ }
        throw err;
    }
}
