import { api } from './api';
import { TokenBalance } from '../types';

export const ChainService = {
    /**
     * Get multi-chain balances via the Alchemy-powered backend
     */
    getMultiChainBalances: async (address: string): Promise<TokenBalance[]> => {
        try {
            const res = await api.get(`/api/portfolio/balances`, { params: { address } });
            if (!res.data || !res.data.success) throw new Error('Backend balance fetch failed');

            const rawData = res.data.data;
            
            // Map the raw multi-chain response to TokenBalance format
            // In Beta, the backend returns an array of chain results or a single chain result
            // Let's handle the array format we implemented in getEvmBalances
            
            if (Array.isArray(rawData)) {
                return rawData.flatMap(chainResult => {
                    const baseToken: TokenBalance = {
                        symbol: chainResult.chain,
                        name: chainResult.chainName,
                        decimals: 18,
                        balance: chainResult.nativeBalance,
                        guiBalance: Number(chainResult.nativeBalance) / 1e18,
                        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                        logo: `https://cryptologos.cc/logos/${chainResult.chain.toLowerCase()}-logo.png`,
                        price: 0, // Prices should be updated by the MarketService later
                        value: 0,
                        chain: chainResult.chain
                    };
                    return [baseToken];
                });
            }

            return [];
        } catch (e) {
            console.error("ChainService: Alchemy backend failed, falling back to mock", e);
            return [];
        }
    }
};
