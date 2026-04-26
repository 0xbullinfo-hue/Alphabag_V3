
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/users.json');

async function fixPassword() {
    try {
        console.log("Reading users.json...");
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        const users = JSON.parse(data);

        const adminEmail = 'admin@alphabagpro.com';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const adminIndex = users.findIndex(u => u.email === adminEmail);

        if (adminIndex === -1) {
            console.log("Admin user not found! Creating one...");
            users.push({
                id: 'admin_fixed_' + Date.now(),
                email: adminEmail,
                password: hashedPassword,
                tier: 'ULTIMATE',
                isAdmin: true,
                createdAt: new Date().toISOString()
            });
        } else {
            console.log("Admin user found. Updating password...");
            users[adminIndex].password = hashedPassword;
            users[adminIndex].isAdmin = true; // Ensure admin rights
        }

        await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
        console.log("SUCCESS: Password updated to 'admin123'");

        // Verify immediately
        const verifyMatch = await bcrypt.compare(newPassword, hashedPassword);
        console.log(`Verification Check: ${verifyMatch}`);

    } catch (error) {
        console.error("FAILED:", error);
    }
}

fixPassword();
