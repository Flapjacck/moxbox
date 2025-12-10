import fs from 'fs';
import path from 'path';
import { listUsers, createUser } from '../models/users';
import { hashPassword } from './passwordHash';
import { info, error } from './logger';

/**
 * generateTempPassword()
 * - Generates a 8-character random password (numbers + uppercase letters)
 * - Format: alphanumeric mix
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * initializeFirstUser()
 * - Called during server startup if no users exist in database
 * - Creates admin user with random temp password
 * - Saves password to INITIAL_PASSWORD.txt in project root
 */
export async function initializeFirstUser(): Promise<void> {
    const users = listUsers();
    if (users.length > 0) {
        return; // Users already exist
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create admin user in database
    createUser({
        username: 'admin',
        passwordHash,
        isAdmin: true,
    });

    // Save password to root directory
    const projectRoot = process.cwd();
    const passwordFile = path.join(projectRoot, 'LOGIN.txt');
    const content = `Initial admin credentials:\nusername=admin\npassword=${tempPassword}\n\nPlease change password after first login.`;

    fs.writeFileSync(passwordFile, content, 'utf-8');
    info(`First admin user created. Password saved to ${passwordFile}`);
}

export default { generateTempPassword, initializeFirstUser };
