import { api } from './api';
import { TokenBalance } from '../types';

export const ChainService = {
    /**
     * Get multi-chain balances via the Alchemy-powered backend
     */
    getMultiChainBalances: async (address: string): Promise<TokenBalance[]> => {
        try {
            if (!address || !address.trim()) {
                console.warn("ChainService: Invalid address provided");
                return [];
            }

            console.log(`[ChainService] Fetching balances for address: ${address.substring(0, 10)}...`);
            
            const res = await api.get(`/api/portfolio/balances`, { 
                params: { address },
                timeout: 30000 
            });
            
            if (!res.data) {
                console.warn("ChainService: Empty response data from backend");
                return [];
            }

            if (!res.data.success) {
                console.warn(`ChainService: Backend returned unsuccessful status - ${res.data.message || 'Unknown error'}`);
                return [];
            }

            const rawData = res.data.data;
            
            // Map the raw multi-chain response to TokenBalance format
            // In Beta, the backend returns an array of chain results or a single chain result
            // Let's handle the array format we implemented in getEvmBalances
            
            if (Array.isArray(rawData)) {
                const results = rawData.flatMap(chainResult => {
                    try {
                        const baseToken: TokenBalance = {
                            symbol: chainResult.chain || 'UNKNOWN',
                            name: chainResult.chainName || chainResult.chain || 'Unknown Chain',
                            decimals: 18,
                            balance: chainResult.nativeBalance || '0',
                            guiBalance: Number(chainResult.nativeBalance || 0) / 1e18,
                            tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                            logo: `https://cryptologos.cc/logos/${(chainResult.chain || 'unknown').toLowerCase()}-logo.png`,
                            price: 0, // Prices should be updated by the MarketService later
                            value: 0,
                            chain: chainResult.chain || 'UNKNOWN'
                        };
                        return [baseToken];
                    } catch (chainErr) {
                        console.warn(`[ChainService] Error processing chain result:`, chainErr);
                        return [];
                    }
                });
                console.log(`[ChainService] Successfully fetched ${results.length} token balances`);
                return results;
            }

            if (typeof rawData === 'object' && rawData !== null) {
                console.warn("ChainService: Expected array but got object, attempting conversion");
                return [];
            }

            console.warn("ChainService: Unexpected data format from backend");
            return [];
        } catch (e: any) {
            console.error("[ChainService] Multi-chain balance fetch failed:", {
                error: e?.message,
                code: e?.code,
                status: e?.response?.status,
                statusText: e?.response?.statusText
            });
            // Return empty array on error - UI will show loading state
            return [];
        }
    }
};
