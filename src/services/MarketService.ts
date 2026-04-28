import { ONE_MINUTE } from './constants';

const API_BASE = 'https://api.coingecko.com/api/v3';
// Note: Free tier has rate limits (approx 10-30 calls/min)

interface CacheItem {
    data: any;
    timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_DURATION = 2 * ONE_MINUTE; // Cache for 2 minutes to be safe

export const MarketService = {
    /**
     * Get simple price for standard coins
     */
    getPrice: async (ids: string[], vs_currencies = 'usd') => {
        const key = `price_${ids.join('_')}_${vs_currencies}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            const res = await fetch(`${API_BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=${vs_currencies}&include_24hr_change=true`);
            if (!res.ok) throw new Error('Market API limit');
            const data = await res.json();

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.error("MarketService Error:", error);
            return null; // Fallback to handle gracefully
        }
    },

    /**
     * Get rich data for specific coins (Market Cards)
     * If ids is empty, fetches top 100 coins
     */
    getMarketData: async (ids: string[], sparkline = false) => {
        const key = `market_${ids.join('_')}_${sparkline}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            console.log('Serving from cache:', key);
            return cache[key].data;
        }

        try {
            const params = new URLSearchParams({
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: '100',
                page: '1',
                sparkline: String(sparkline),
                price_change_percentage: '1h,24h,7d'
            });

            if (ids.length > 0) {
                params.append('ids', ids.join(','));
            }

            const res = await fetch(`${API_BASE}/coins/markets?${params.toString()}`);
            if (!res.ok) throw new Error('Market API limit');
            const data = await res.json();

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.error("MarketService Error:", error);
            return [];
        }
    },

    /**
     * Search for coins
     */
    searchCoins: async (query: string) => {
        // No cache for search usually, or short cache
        try {
            const res = await fetch(`${API_BASE}/search?query=${query}`);
            const data = await res.json();
            return data.coins || [];
        } catch (error) {
            return [];
        }
    },

    /**
     * Get Token Prices by Contract Address
     */
    getTokenPrices: async (platform: string, contractAddresses: string[]) => {
        const key = `token_price_${platform}_${contractAddresses.join('_')}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            const res = await fetch(`${API_BASE}/simple/token_price/${platform}?contract_addresses=${contractAddresses.join(',')}&vs_currencies=usd`);
            if (!res.ok) throw new Error('Market API limit');
            const data = await res.json();

            cache[key] = { data, timestamp: Date.now() };
            return data;
        } catch (error) {
            console.warn("MarketService Token Price Fetch Error:", error);
            return {};
        }
    },

    /**
     * Get Token Price from DexScreener (Real-time for unlisted tokens)
     * Supports multi-chain by address -- usually returns pairs for all chains where token exists
     */
    getDexTokenPrice: async (tokenAddress: string) => {
        // Cache key for DexScreener
        const key = `dex_price_${tokenAddress}`;
        if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
            return cache[key].data;
        }

        try {
            // DexScreener endpoint: https://api.dexscreener.com/latest/dex/tokens/{tokenAddresses}
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            if (!res.ok) {
                // Not an error per se, just no data maybe
                return null;
            }

            const data = await res.json();
            if (data.pairs && data.pairs.length > 0) {
                // Find best pair (highest liquidity USD)
                // Filter out low liquidity spam if needed, or just take top
                const bestPair = data.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

                if (bestPair) {
                    const priceUsd = Number(bestPair.priceUsd);
                    const result = {
                        price: priceUsd,
                        pair: bestPair,
                        priceChange24h: bestPair.priceChange?.h24 || 0
                    };

                    // Cache result
                    cache[key] = { data: result, timestamp: Date.now() };
                    return result;
                }
            }
            return null;
        } catch (e) {
            console.warn("DexScreener Fetch Error", e);
            return null;
        }
    }
};
