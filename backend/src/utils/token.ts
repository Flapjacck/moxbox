import jwt from 'jsonwebtoken';
import config from '../config/env';
import type { UserClaim } from '../types/auth';

/*
 * Utilities to sign and verify JWT tokens for this application.
 *
 * The module provides a tiny wrapper around `jsonwebtoken` with a few
 * conveniences and stricter TypeScript types for our `UserClaim` jwt payload.
 *
 * Security notes:
 * - The JWT secret is loaded from `src/config/env.ts`; this module will throw
 *   if the secret isn't set so developers don't accidentally sign/verify
 *   tokens with an empty secret in production.
 * - The payload used for tokens is the `UserClaim` type which contains only
 *   the minimal information needed by the app (id, username, role). Avoid
 *   storing sensitive user data in JWT claims (e.g. password hashes).
 */

/**
 * Sign a JWT containing the provided `UserClaim` payload.
 *
 * @param payload - The user claim payload to include in the token (id, username, role).
 * @param expiresIn - Optional expiration string accepted by jsonwebtoken (default: '1h').
 * @returns A signed JWT string.
 * @throws if the `JWT_SECRET` is not configured.
 *
 * Example: signToken({ id: '123', username: 'jdoe', role: 'user' }, '2h')
 */
export function signToken(payload: UserClaim, expiresIn = '1h'): string {
    const secret = config.jwtSecret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(payload as jwt.JwtPayload, secret as jwt.Secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify a JWT string and return the decoded `UserClaim` payload.
 *
 * This function performs runtime checks on the decoded token to ensure
 * it contains the expected fields (`id`, `username`, and `role`). It throws
 * an Error for invalid tokens or missing claims.
 *
 * @param token - The JWT string to verify.
 * @returns The decoded `UserClaim` extracted from the token.
 * @throws Error if the `JWT_SECRET` is missing, the token is invalid, or the
 *               payload does not contain the required fields.
 */
export function verifyToken(token: string): UserClaim {
    const secret = config.jwtSecret;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    const decoded = jwt.verify(token, secret as jwt.Secret) as unknown;
    // We expect the token to contain { id, username, role }
    if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid token payload');
    }
    const obj = decoded as Partial<UserClaim>;
    if (!obj.id || !obj.username || !obj.role) {
        throw new Error('Invalid token claims: missing required fields');
    }
    return obj as UserClaim;
}

export default { signToken, verifyToken };
