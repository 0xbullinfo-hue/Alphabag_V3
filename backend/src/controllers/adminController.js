
import { store } from '../services/storeService.js';

// --- SYSTEM & USERS ---
export const getSystemStats = async (req, res) => {
    const users = await store.read('users');
    const news = await store.read('news');
    const signals = await store.read('signals');

    const stats = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        totalUsers: users.length,
        totalNews: news.length,
        totalSignals: signals.length,
        freeUsers: users.filter(u => u.tier === 'FREE').length,
        ultimateUsers: users.filter(u => u.tier === 'ULTIMATE').length,
        totalVisits: users.reduce((acc, u) => acc + (u.visits || 0), 0),
        health: 'OPTIMAL',
        cacheStats: {
            portfolio: { keys: 0 },
            price: { keys: 150 },
            ai: { keys: 25 }
        }
    };
    res.json(stats);
};

export const getUsers = async (req, res) => {
    const users = await store.read('users');
    // Return safe user objects
    const safeUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        tier: u.tier,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        visits: u.visits,
        lastActive: u.lastActive,
        location: u.location
    }));
    res.json(safeUsers);
};

// --- CONTENT MANAGEMENT ---

// News
export const createNews = async (req, res) => {
    const { title, summary, content, imageUrl, source, sentiment, isPremium } = req.body;

    if (!title || !summary) return res.status(400).json({ error: 'Title and Summary required' });

    const newItem = {
        title, summary, content, imageUrl, source, sentiment, isPremium: !!isPremium,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    const saved = await store.create('news', newItem);
    res.json({ success: true, item: saved });
};

export const deleteNews = async (req, res) => {
    const { id } = req.params;
    const list = await store.read('news');
    const filtered = list.filter(i => i.id !== id);
    if (list.length === filtered.length) return res.status(404).json({ error: 'Item not found' });

    await store.write('news', filtered);
    res.json({ success: true });
};

// Signals
export const createSignal = async (req, res) => {
    const { pair, type, entry, stopLoss, targets, narrative, category, risk, description, socialLinks, relevantInfo, tokenInfo, leverage, contractAddress } = req.body;

    const newItem = {
        pair, type, entry, stopLoss, targets: Array.isArray(targets) ? targets : (targets ? targets.split(',') : []),
        narrative, category, risk, description, socialLinks, relevantInfo, tokenInfo, leverage, contractAddress,
        status: 'ACTIVE',
        timestamp: 'Just now'
    };

    const saved = await store.create('signals', newItem);
    res.json({ success: true, item: saved });
};

export const updateSignal = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const list = await store.read('signals');
    const index = list.findIndex(i => i.id === id);

    console.log(`[DEBUG] Update Signal: ID=${id}, Found Index=${index}, Total Signals=${list.length}`);

    if (index === -1) {
        console.error(`[ERROR] Signal ID ${id} not found in store.`);
        return res.status(404).json({ error: 'Signal not found' });
    }

    // Validate Status Update
    if (updates.status && !['ACTIVE', 'HIT', 'LOSS', 'CLOSED', 'PENDING'].includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid Status' });
    }

    const updatedItem = { ...list[index], ...updates };
    list[index] = updatedItem;

    await store.write('signals', list);
    res.json({ success: true, item: updatedItem });
};

export const deleteSignal = async (req, res) => {
    const { id } = req.params;
    const list = await store.read('signals');
    const filtered = list.filter(i => i.id !== id);
    await store.write('signals', filtered);
    res.json({ success: true });
};

// --- WHALE WATCH & SETTINGS ---

export const getWhaleFollows = async (req, res) => {
    const follows = await store.read('whale_follows');
    res.json(follows);
};

export const addWhaleFollow = async (req, res) => {
    const { address, name, threshold, chain } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });

    const newFollow = {
        address,
        name: name || 'Unknown Whale',
        threshold: parseFloat(threshold) || 100000,
        chain: chain || 'ETH',
        status: 'ACTIVE',
        lastAlert: null
    };

    const saved = await store.create('whale_follows', newFollow);
    res.json({ success: true, item: saved });
};

export const deleteWhaleFollow = async (req, res) => {
    const { id } = req.params;
    const list = await store.read('whale_follows');
    const filtered = list.filter(i => i.id !== id);
    await store.write('whale_follows', filtered);
    res.json({ success: true });
};

export const getAdminSettings = async (req, res) => {
    const list = await store.read('admin_settings');
    const settings = list.length > 0 ? list[0] : {};
    res.json(settings);
};

export const updateAdminSettings = async (req, res) => {
    const updates = req.body;
    let list = await store.read('admin_settings');

    if (list.length === 0) {
        // Create initial
        await store.create('admin_settings', updates);
    } else {
        // Update existing (always index 0)
        let settings = list[0];
        settings = { ...settings, ...updates };
        list[0] = settings;
        await store.write('admin_settings', list);
    }

    res.json({ success: true });
};

// Test Alert
import { sendTelegramMessage } from '../services/telegramService.js';
export const sendTestAlert = async (req, res) => {
    const sent = await sendTelegramMessage("🔔 **Test Alert** from AlphaBAG Admin Panel.\n\nSystem is online.");
    if (sent) res.json({ success: true });
    else res.status(500).json({ error: 'Failed to send. Check Bot Token/Chat ID.' });
};
