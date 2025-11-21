/**
 * Auth-related types used across the project.
 *
 * This file contains a `UserClaim` interface used as the JWT payload for the
 * single-user authentication implementation. It is intentionally kept in
 * `src/types` to indicate this is a type-only module for the TypeScript
 * compiler (no runtime code).
 */
export interface UserClaim {
    id: string;
    username: string;
    role: string;
    iat?: number;
    exp?: number;
}

export default {} as unknown as void;
