
import { store } from '../services/storeService.js';

// Get user history
export const getHistory = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : 'guest';
        if (userId === 'guest') return res.json([]);

        // Read specific user's history file
        const userHistory = await store.read(`history_${userId}`);
        res.json(userHistory);
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};

// Save a snapshot (Limited to 1 per hour per user to prevent spam)
export const saveSnapshot = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : 'guest';
        const { totalValue } = req.body;

        if (userId === 'guest' || totalValue === undefined || totalValue === null) {
            return res.json({ success: false, reason: 'Invalid data' });
        }

        const collectionName = `history_${userId}`;
        let userHistory = await store.read(collectionName);

        // store.read returns [] for new files
        if (!Array.isArray(userHistory)) userHistory = [];

        const now = new Date();

        // Check last snapshot time
        if (userHistory.length > 0) {
            const lastSnapshot = new Date(userHistory[userHistory.length - 1].date);
            const hoursDiff = (now - lastSnapshot) / (1000 * 60 * 60);

            // Limit: Only save if > 1 hour passed
            if (hoursDiff < 1) {
                return res.json({ success: true, message: 'Skipped (Cooldown)' });
            }
        }

        // Append new snapshot
        userHistory.push({
            date: now.toISOString(),
            value: parseFloat(totalValue)
        });

        // Keep only last 365 days (approx 24 * 365 = 8760 points max) to save space
        if (userHistory.length > 9000) {
            userHistory.shift();
        }

        await store.write(collectionName, userHistory);

        res.json({ success: true });

    } catch (error) {
        console.error('Save Snapshot Error:', error);
        res.status(500).json({ error: 'Failed to save snapshot' });
    }
};
