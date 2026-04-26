import { store } from '../services/storeService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getNews = async (req, res) => {
    let news = await store.read('news');
    
    // Seed if empty
    if (news.length === 0) {
        try {
            const seedPath = path.join(__dirname, '../../data/news_seed.json');
            if (fs.existsSync(seedPath)) {
                news = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
                await store.write('news', news);
            }
        } catch (e) { console.error('News seeding failed', e); }
    }

    res.json(news.slice().reverse());
};

export const getSignals = async (req, res) => {
    let signals = await store.read('signals');
    
    // Seed if empty
    if (signals.length === 0) {
        try {
            const seedPath = path.join(__dirname, '../../data/signals_seed.json');
            if (fs.existsSync(seedPath)) {
                signals = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
                await store.write('signals', signals);
            }
        } catch (e) { console.error('Signals seeding failed', e); }
    }

    const user = req.user;

    // Tier Enforcement
    // If user is not ULTIMATE and not ADMIN, we might blur data or restrict
    if (!user || (user.tier !== 'ULTIMATE' && !user.isAdmin)) {
        // Return limited data for FREE users (Upsell)
        // Or just return empty/error if we want strict gating.
        // The requirement says "AlphaCalls generates high-conviction... Access is restricted".
        // Frontend currently shows a "Lock" screen if not Ultimate.
        // So for backend, we can send them, but maybe obscure critical data to be safe?
        // OR we relies on frontend logic (less secure).
        // Let's implement Safe Gating:

        // For DEGEN/LONGTERM signals, we hide Entry/Targets
        const safeSignals = signals.map(s => ({
            ...s,
            entry: '***',
            stopLoss: '***',
            targets: ['***'],
            narrative: 'Upgrade to Ultimate to view this Alpha.'
        }));
        return res.json(safeSignals.slice().reverse());
    }

    // If Ultimate, return full data
    res.json(signals.slice().reverse());
};
