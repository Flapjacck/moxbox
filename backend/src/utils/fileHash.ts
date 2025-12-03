import { createReadStream } from 'fs';
import crypto from 'crypto';

/**
 * Computes SHA256 hash of a file at the given path.
 * Uses streaming to handle large files efficiently.
 */
export async function computeSha256(absolutePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(absolutePath);
    for await (const chunk of stream) {
        hash.update(chunk);
    }
    return hash.digest('hex');
}
