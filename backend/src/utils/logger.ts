import { Request, Response, NextFunction } from 'express';

/**
 * Simple logger util for the backend.
 *
 * This is intentionally small and synchronous — it simply forwards to
 * `console.log` / `console.error` with a timestamp prefix and optional
 * meta information.
 */

/** Format a timestamped message. Internal helper. */
function formatMessage(level: string, message: string) {
    return `[${level}] ${new Date().toISOString()} - ${message}`;
}

/** Log a simple info message with optional metadata. */
export function info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
        // Print meta as JSON when provided — useful for structured debugging.
        console.log(formatMessage('INFO', message), JSON.stringify(meta));
        return;
    }
    console.log(formatMessage('INFO', message));
}

/** Log an error with an optional error object / metadata. */
export function error(message: string, meta?: unknown) {
    if (meta instanceof Error) {
        console.error(formatMessage('ERROR', message), { name: meta.name, message: meta.message, stack: meta.stack });
        return;
    }

    if (meta) {
        console.error(formatMessage('ERROR', message), JSON.stringify(meta));
        return;
    }

    console.error(formatMessage('ERROR', message));
}

/**
 * Express middleware that logs incoming requests and their outcomes.
 *
 * Behavior:
 * - Logs when a request is received (method + path)
 * - When the response finishes, logs whether it succeeded (status < 400) or
 *   failed (status >= 400) along with the duration in milliseconds.
 * - Only logs the request body when it looks small to avoid noisy logs.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const shortBody = (body: any) => {
        try {
            const json = typeof body === 'string' ? body : JSON.stringify(body);
            // Avoid logging very large payloads — only show small ones (1 KB)
            return json.length < 1024 ? json : undefined;
        } catch {
            return undefined;
        }
    };

    info('Incoming request', { method: req.method, path: req.originalUrl, body: shortBody(req.body) });

    // When the response finishes, log the result and duration
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const meta = { method: req.method, path: req.originalUrl, status, duration };

        if (status >= 400) {
            error('Request completed with error status', meta);
        } else {
            info('Request completed successfully', meta);
        }
    });

    return next();
}

export default { info, error, requestLogger };
