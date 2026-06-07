import axios from 'axios';

export const proxyBlockExplorer = async (req, res) => {
    try {
        const { explorer } = req.params;
        const queryParams = new URLSearchParams(req.query).toString();

        let baseUrl = '';
        let apiKey = '';

        if (explorer === 'etherscan') {
            baseUrl = 'https://api.etherscan.io/api';
            apiKey = process.env.ETHERSCAN_API_KEY;
        } else if (explorer === 'bscscan') {
            baseUrl = 'https://api.bscscan.com/api';
            apiKey = process.env.BSCSCAN_API_KEY;
        } else {
            return res.status(400).json({ error: 'Unsupported explorer' });
        }

        if (!apiKey) {
            console.warn(`[ProxyController] Missing API key for ${explorer}`);
            return res.status(500).json({ error: `Server missing API key for ${explorer}` });
        }

        const url = `${baseUrl}?${queryParams}&apikey=${apiKey}`;
        
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('[ProxyController] Proxy error:', error.message);
        res.status(500).json({ error: 'Failed to fetch from external API' });
    }
};
