/**
 * Global Express type augmentation for this project
 *
 * Purpose:
 * - Augment `Express.Request` with a `user` property that the `authenticate`
 *   middleware populates. This file is a pure declaration file, so it does not
 *   emit runtime code and can be placed under `src/types/` without side-effects.
 *
 * Why this file lives in `src/types/express/index.d.ts`:
 * - Keeping declaration-only files in `src/types` makes it obvious they are used
 *   by the TypeScript compiler only, and avoids mixing runtime code with global
 *   type augmentation. This is a common convention in TS projects and keeps
 *   augmentations discoverable.
 *
 * Naming:
 * - `express/index.d.ts` follows a namespace-like folder structure (`types/express`)
 *   indicating this augmentation is specifically targeted at Express types.
 *   Using `index.d.ts` ensures the compiler finds the declarations by file name
 *   while preserving a clear folder structure.
 */
import type { UserClaim } from '../../types/auth';

declare global {
    namespace Express {
        export interface Request {
            /**
             * Populated by the `authenticate` middleware
             */
            user?: UserClaim;
        }
    }
}

export { };
