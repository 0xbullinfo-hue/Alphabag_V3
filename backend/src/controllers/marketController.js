
import axios from 'axios';
import NodeCache from 'node-cache';

const priceCache = new NodeCache({ stdTTL: 10 });
const searchCache = new NodeCache({ stdTTL: 60 }); // Cache searches for 1 minute

export const getPrices = async (req, res) => {
    const { ids } = req.query;
    const cacheKey = `prices_${ids}`;

    if (priceCache.has(cacheKey)) {
        return res.json(priceCache.get(cacheKey));
    }

    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: ids,
                vs_currencies: 'usd',
                include_24hr_change: 'true'
            },
            headers: process.env.COINGECKO_API_KEY ? { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY } : {}
        });

        priceCache.set(cacheKey, response.data);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Market data sync failed' });
    }
};

export const searchCoins = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    const cacheKey = `search_${query.toLowerCase()}`;
    if (searchCache.has(cacheKey)) {
        return res.json(searchCache.get(cacheKey));
    }

    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/search?query=${query}`);
        const results = response.data.coins.slice(0, 8); // Return top 8 matches
        searchCache.set(cacheKey, results);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
};
