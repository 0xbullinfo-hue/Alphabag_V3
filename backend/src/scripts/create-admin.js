
import bcrypt from 'bcryptjs';
import { store } from '../services/storeService.js';

const createAdmin = async () => {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Usage: node create-admin.js <email> <password>');
        process.exit(1);
    }

    await store.init();
    const existing = await store.findOne('users', { email });

    if (existing) {
        console.log(`User ${email} already exists. promoting to Admin...`);
        // Ideally update, but storeService.update isn't implemented generic yet.
        // Let's just read all, update, write.
        const users = await store.read('users');
        const updated = users.map(u => u.email === email ? { ...u, isAdmin: true, tier: 'ULTIMATE' } : u);
        await store.write('users', updated);
        console.log('User promoted successfully.');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await store.create('users', {
        email,
        password: hashedPassword,
        tier: 'ULTIMATE',
        isAdmin: true,
        createdAt: new Date().toISOString()
    });

    console.log(`Admin user ${email} created successfully.`);
};

createAdmin().catch(console.error);
