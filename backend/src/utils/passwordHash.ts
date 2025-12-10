import bcrypt from 'bcrypt';

/**
 * passwordHash.ts
 * - Utilities for hashing and verifying passwords
 * - Uses bcrypt with a salt round of 10 for security
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password
 *
 * @param password - Plain-text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a hash
 *
 * @param password - Plain-text password to verify
 * @param hash - The stored password hash
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export default { hashPassword, verifyPassword };
