/**
 * users/index.ts
 * - Barrel export for users model
 */

export { initializeUsersModel } from './users.schema';
export { createUser, getUserById, getUserByUsername, updatePassword, listUsers } from './users.helper';
export type { UserRecord } from './users.helper';

export default {};
