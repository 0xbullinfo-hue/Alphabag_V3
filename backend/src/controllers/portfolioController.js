import { blockchainService } from '../services/blockchainService.js';

export const getBalances = async (req, res) => {
    const { address, chain } = req.query;
    
    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        let balances;
        if (chain === 'SOL') {
            balances = await blockchainService.getSolanaBalances(address);
        } else {
            // Default to EVM
            balances = await blockchainService.getEvmBalances(address);
        }

        res.json({ success: true, data: balances });
    } catch (err) {
        console.error('PortfolioController: Error fetching balances:', err.message);
        res.status(500).json({ error: 'Failed to fetch blockchain data' });
    }
};

export const getAggregatedPortfolio = async (req, res) => {
    const { address } = req.query; // Assuming EVM address for now, or multi-chain array
    // This would ideally fetch from all supported chains and return a unified view
    try {
        const evmBalances = await blockchainService.getEvmBalances(address);
        res.json({ success: true, data: evmBalances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
