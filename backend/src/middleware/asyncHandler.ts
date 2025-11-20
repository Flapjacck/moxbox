import { Request, Response, NextFunction } from 'express';

/**
 * asyncHandler
 * A tiny wrapper that forwards rejected promises / thrown errors from async
 * route handlers into the Express error pipeline (i.e. `next(err)`).
 *
 * Usage:
 *  router.get('/path', asyncHandler(async (req, res) => {
 *      // async work here; any thrown/rejected error will be forwarded
 *      throw new Error('boom');
 *  }));
 *
 * Benefits:
 * - Reduces try/catch boilerplate in each route
 * - Ensures all thrown errors are handled by a global error handler (like `errorHandler`)
 */
export default function asyncHandler(
    fn: (req: Request, res: Response, next?: NextFunction) => Promise<unknown> | unknown,
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
        // Ensure we catch both thrown errors and rejected promises
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
