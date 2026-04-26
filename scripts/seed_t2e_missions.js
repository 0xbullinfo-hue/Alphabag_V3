import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Pool } = pg;
import { PrismaPg } from '@prisma/adapter-pg';

// Using the direct local postgres URL provide by 'prisma dev' to satisfy the pg driver
// and satisfy the @prisma/adapter-pg requirement without proxy interference.
const DIRECT_URL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0";

const pool = new Pool({ connectionString: DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- SEEDING T2E MISSIONS (21 ACTIVE) ---');

    const missions = [
        // --- SOCIAL (6) ---
        {
            title: 'Follow @AlphaBAG_Global on X',
            description: 'Join our primary intelligence broadcast network on X (Twitter).',
            rewardTokens: 100,
            type: 'SOCIAL',
            frequency: 'ONCE',
            requiresLink: true,
            actionUrl: 'https://x.com/AlphaBAG_Global'
        },
        {
            title: 'Join AlphaBAG Telegram Hub',
            description: 'Enter the inner circle. Join our community hub on Telegram for real-time alpha.',
            rewardTokens: 75,
            type: 'SOCIAL',
            frequency: 'ONCE',
            requiresLink: true,
            actionUrl: 'https://t.me/AlphaBAG_Hub'
        },
        {
            title: 'Post about AlphaBAG Insights',
            description: 'Share your dashboard or a performance chart on X and tag #AlphaBAG.',
            rewardTokens: 150,
            type: 'SOCIAL',
            frequency: 'DAILY',
            requiresLink: true,
            actionUrl: 'https://x.com/compose/tweet'
        },
        {
            title: 'Weekly Community Sync AMA',
            description: 'Attend the weekly Alpha Sync AMA on Discord or X Spaces.',
            rewardTokens: 200,
            type: 'SOCIAL',
            frequency: 'WEEKLY',
            requiresLink: true
        },
        {
            title: 'Discord Syndicate Verification',
            description: 'Link your wallet in Discord to unlock your Pro status and syndicate role.',
            rewardTokens: 50,
            type: 'SOCIAL',
            frequency: 'ONCE',
            requiresLink: false,
            actionUrl: 'https://discord.gg/AlphaBAG'
        },
        {
            title: 'Engage with DevLog Updates',
            description: 'Like and Comment on the latest development update in the ecosystem feed.',
            rewardTokens: 25,
            type: 'SOCIAL',
            frequency: 'DAILY',
            requiresLink: false
        },

        // --- TECHNICAL (7) ---
        {
            title: 'Connect Pro Tracking Hub',
            description: 'Stream your first exchange or wallet via our read-only integration hub.',
            rewardTokens: 300,
            type: 'TECHNICAL',
            frequency: 'ONCE',
            requiresLink: false,
            actionUrl: '/portfolio'
        },
        {
            title: 'Initialize Whale Tracker',
            description: 'Set up your first custom Whale Tracker alert for any BSC/ETH pair.',
            rewardTokens: 100,
            type: 'TECHNICAL',
            frequency: 'ONCE',
            requiresLink: false,
            actionUrl: '/radar'
        },
        {
            title: 'Neural Core Intelligence Query',
            description: 'Execute a deep-dive intelligence query on the Neural Core hub.',
            rewardTokens: 20,
            type: 'TECHNICAL',
            frequency: 'DAILY',
            requiresLink: false,
            actionUrl: '/neural'
        },
        {
            title: 'Submit High-Heat Pair Signal',
            description: 'Identify and submit a high-quality live pair to the Alpha Screener.',
            rewardTokens: 250,
            type: 'TECHNICAL',
            frequency: 'WEEKLY',
            requiresLink: false,
            actionUrl: '/alpha-bag'
        },
        {
            title: 'Secure API Key Sync',
            description: 'Verify your API tier by syncing through the Secure Integration layer.',
            rewardTokens: 150,
            type: 'TECHNICAL',
            frequency: 'ONCE',
            requiresLink: false,
            actionUrl: '/integrations'
        },
        {
            title: 'Whale Move Case Study',
            description: 'Submit an analysis of a major whale move identified by the tracker.',
            rewardTokens: 500,
            type: 'TECHNICAL',
            frequency: 'LIMITED',
            requiresLink: true
        },
        {
            title: 'Protocol Optimization Report',
            description: 'Submit a technical bug report or feature improvement through the hub.',
            rewardTokens: 400,
            type: 'TECHNICAL',
            frequency: 'UNLIMITED',
            requiresLink: true
        },

        // --- GROWTH (5) ---
        {
            title: 'Recruit Network Participant',
            description: 'Successfully refer one active trader to the AlphaBAG network.',
            rewardTokens: 100,
            type: 'GROWTH',
            frequency: 'UNLIMITED',
            requiresLink: false
        },
        {
            title: 'Syndicate Milestone (5 Recruits)',
            description: 'Unlock this bonus by recruiting 5 active members to the network.',
            rewardTokens: 1000,
            type: 'GROWTH',
            frequency: 'ONCE',
            requiresLink: false,
            requiredCount: 5
        },
        {
            title: 'Alpha Digest Subscription',
            description: 'Subscribe to the AlphaBAG Weekly Intel Digest for institutional insights.',
            rewardTokens: 50,
            type: 'GROWTH',
            frequency: 'ONCE',
            requiresLink: false
        },
        {
            title: 'Bounty: Daily Social Share',
            description: 'Post your referral link on social media to keep the ecosystem growing.',
            rewardTokens: 10,
            type: 'GROWTH',
            frequency: 'DAILY',
            requiresLink: true
        },
        {
            title: 'Ecosystem Partnership Lead',
            description: 'Submit a proposal for a new community integration or strategic partnership.',
            rewardTokens: 600,
            type: 'GROWTH',
            frequency: 'LIMITED',
            requiresLink: true
        },

        // --- REVIEW (3) ---
        {
            title: 'Trustpilot Ecosystem Review',
            description: 'Share your professional experience with AlphaBAG on Trustpilot.',
            rewardTokens: 300,
            type: 'REVIEW',
            frequency: 'ONCE',
            requiresLink: true,
            actionUrl: 'https://trustpilot.com/review/AlphaBAG'
        },
        {
            title: 'Peer Data Audit',
            description: 'Review and fact-check 5 recent community alpha submissions.',
            rewardTokens: 100,
            type: 'REVIEW',
            frequency: 'DAILY',
            requiresLink: false
        },
        {
            title: 'Publish Alpha Case Study',
            description: 'Document how AlphaBAG tools helped you secure a winning trade.',
            rewardTokens: 800,
            type: 'REVIEW',
            frequency: 'UNLIMITED',
            requiresLink: true
        }
    ];

    let created = 0;
    for (const m of missions) {
        try {
            await prisma.t2EMission.create({
                data: {
                    ...m,
                    rewardTokens: m.rewardTokens,
                    status: 'ACTIVE'
                }
            });
            created++;
            console.log(`[OK] Created: ${m.title}`);
        } catch (e) {
            console.error(`[FAIL] Error creating ${m.title}:`, e.message);
        }
    }

    console.log(`--- SEEDING COMPLETE: ${created}/21 MISSIONS DEPLOYED ---`);
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
