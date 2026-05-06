/**
 * TOKEN BALANCE SERVICE - BACKEND
 * Verifies user token holdings on BSC blockchain
 * 
 * Used by middleware and routes to determine premium access
 */

import axios from 'axios';
import { TOKEN_GATING_CONFIG } from '../config/tokenGatingConfig.js';

class TokenBalanceServiceBackend {
  constructor() {
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
    this.bscscanApiKey = process.env.BSCSCAN_API_KEY || '';
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.balanceCache = new Map();
  }

  /**
   * Get token balance for a wallet address
   * @param {string} address - Wallet address to check
   * @returns {Promise<number>} Token balance (normalized)
   */
  async getTokenBalance(address) {
    if (!TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
      return 0;
    }

    // Check cache first
    const cached = this.getCache(address);
    if (cached !== null) {
      console.log(`✅ Token balance for ${address} from cache: ${cached}`);
      return cached;
    }

    try {
      // Use BscScan API to get ERC20 token balance
      const tokenAddress = TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET;
      if (!tokenAddress) {
        console.warn('BAG token address not configured');
        return 0;
      }

      const response = await axios.get('https://api.bscscan.com/api', {
        params: {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: tokenAddress,
          address: address,
          tag: 'latest',
          apikey: this.bscscanApiKey
        }
      });

      if (response.data.status !== '1') {
        console.warn(`Failed to fetch token balance for ${address}:`, response.data.message);
        return 0;
      }

      // Balance is in the smallest unit, need to normalize
      const balance = this.normalizeBalance(response.data.result);

      // Cache the result
      this.setCache(address, balance);

      console.log(`✅ Token balance for ${address}: ${balance}`);
      return balance;
    } catch (error) {
      console.error(`Error fetching token balance for ${address}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if wallet is qualified for premium tier
   * @param {string} address - Wallet address
   * @returns {Promise<boolean>} true if qualified
   */
  async isQualifiedForPremium(address) {
    if (!TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
      return true; // Everyone qualified if gating disabled
    }

    const balance = await this.getTokenBalance(address);
    const qualified = balance >= TOKEN_GATING_CONFIG.MIN_BAG_REQUIRED;

    console.log(`Premium qualification for ${address}: ${qualified ? 'YES' : 'NO'} (${balance} BAG required ${TOKEN_GATING_CONFIG.MIN_BAG_REQUIRED})`);
    return qualified;
  }

  /**
   * Normalize token balance from smallest unit (18 decimals for BAG)
   * @param {string} balance - Balance in smallest unit
   * @returns {number} Normalized balance
   */
  normalizeBalance(balance) {
    // BAG token assumed to have 18 decimals (standard ERC20)
    const decimals = 18;
    return Number(balance) / Math.pow(10, decimals);
  }

  /**
   * Cache management
   */
  getCache(address) {
    const key = address.toLowerCase();
    const entry = this.balanceCache.get(key);

    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheExpiry) {
      this.balanceCache.delete(key);
      return null;
    }

    return entry.balance;
  }

  setCache(address, balance) {
    const key = address.toLowerCase();
    this.balanceCache.set(key, {
      balance,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.balanceCache.clear();
  }
}

export default new TokenBalanceServiceBackend();
