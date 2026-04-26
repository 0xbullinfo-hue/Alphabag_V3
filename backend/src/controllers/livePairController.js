import { store } from '../services/storeService.js';

export const getLivePairs = async (req, res) => {
    try {
        const pairs = await store.read('user_submitted_pairs');
        const users = await store.read('users');

        const enriched = pairs.map(p => ({
            ...p,
            user: users.find(u => u.id === p.userId) || { walletAddress: p.userId, tier: 'DEGEN' }
        })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
        
        res.json({ success: true, pairs: enriched });
    } catch (error) {
        console.error('Error fetching live pairs:', error);
        res.status(500).json({ error: 'Server node error' });
    }
};

export const submitPair = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { contractAddress } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!contractAddress || contractAddress.length < 32) return res.status(400).json({ error: 'Invalid Contract Address structure.' });

        // Check Rate limit (1 per 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const submissions = await store.read('user_submitted_pairs');
        const recentSubmission = submissions.find(s => 
            s.userId === userId && new Date(s.createdAt) >= thirtyDaysAgo
        );

        if (recentSubmission) {
            return res.status(429).json({ error: 'Submission throttled. Holders are restricted to 1 Alpha Pair per 30 days.' });
        }

        // Validate via DexScreener API
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
        const dexData = await dexRes.json();

        if (!dexData.pairs || dexData.pairs.length === 0) {
            return res.status(404).json({ error: 'No live liquidity pairs found on DexScreener for this Contract Address.' });
        }

        const primaryPair = dexData.pairs[0];

        // Save to Store
        const submission = {
            id: 'pair_' + Math.random().toString(36).substr(2, 9),
            userId,
            contractAddress: primaryPair.baseToken.address,
            chainId: primaryPair.chainId,
            symbol: primaryPair.baseToken.symbol,
            price: primaryPair.priceUsd,
            createdAt: new Date().toISOString()
        };

        await store.create('user_submitted_pairs', submission);

        res.json({ success: true, message: 'Alpha Pair successfully indexed via DexScreener verification.', data: submission });
    } catch (error) {
        console.error('Error submitting live pair:', error);
        res.status(500).json({ error: 'Internal API routing error. Try again.' });
    }
};
