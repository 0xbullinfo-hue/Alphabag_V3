import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Pool } = pg;
import { PrismaPg } from '@prisma/adapter-pg';

const DIRECT_URL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0";

const pool = new Pool({ connectionString: DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminWallet = '0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96';
    
    console.log(`--- SEEDING ADMIN: ${adminWallet} ---`);

    try {
        const admin = await prisma.user.upsert({
            where: { walletAddress: adminWallet },
            update: { role: 'ADMIN' },
            create: {
                walletAddress: adminWallet,
                role: 'ADMIN',
                projectName: 'AlphaBAG Admin', // Optional descriptive field
                tier: 'ULTIMATE'
            }
        });

        console.log(`[OK] Admin Seeded/Updated: ${admin.id}`);
    } catch (e) {
        console.error(`[FAIL] Error seeding admin:`, e.message);
    }

    console.log('--- SEEDING COMPLETE ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
