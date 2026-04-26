
import axios from 'axios';
import NodeCache from 'node-cache';

const whaleCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

export const getTopHolders = async (req, res) => {
    const { token_address } = req.query;
    if (!token_address) return res.status(400).json({ error: 'token_address required' });

    const cacheKey = `top_${token_address.toLowerCase()}`;
    if (whaleCache.has(cacheKey)) {
        return res.json(whaleCache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.nansen.ai/v2/tokens/${token_address}/top-holders`, {
            headers: { 'api-key': process.env.NANSEN_API_KEY }
        });
        const results = response.data.holders.slice(0, 25);
        whaleCache.set(cacheKey, results);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Whale data unavailable' });
    }
};

export const followWhale = async (req, res) => {
    const { userId, whaleAddress, minThreshold } = req.body;
    // TODO: Implement persistent following logic in StoreService later
    res.json({ success: true, message: `Now tracking ${whaleAddress}` });
};
