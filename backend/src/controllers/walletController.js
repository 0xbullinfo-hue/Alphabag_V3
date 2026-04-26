
import axios from 'axios';
import NodeCache from 'node-cache';
import { config } from '../config/env.js';

const portfolioCache = new NodeCache({ stdTTL: 30 });

export const getPortfolio = async (req, res) => {
    const { address } = req.params;
    const cacheKey = `portfolio_${address}`;

    if (portfolioCache.has(cacheKey)) {
        return res.json(portfolioCache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.zerion.io/v1/wallets/${address}/portfolio`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(process.env.ZERION_API_KEY + ':').toString('base64')}`,
                'accept': 'application/json'
            }
        });

        const data = response.data.data;
        portfolioCache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        const status = error.response?.status || 500;
        // Fallback or just error
        res.status(status).json({ error: error.message });
    }
};
