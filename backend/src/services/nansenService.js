import axios from 'axios';

/**
 * NansenService - Real Whale Transaction Monitoring
 * Premium feature: Fetches actual whale transactions from Nansen API
 *
 * Features:
 * - Real whale transaction data (no more fake alerts)
 * - Error handling for API failures
 * - Configurable API key support
 * - Premium feature for verified users
 */
class NansenService {
  constructor() {
    this.apiKey = process.env.NANSEN_API_KEY;
    this.baseUrl = 'https://api.nansen.ai/v1';

    // Initialize axios client with auth
    this.client = axios.create({
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000, // 10 second timeout
    });
  }

  /**
   * Fetch recent transactions for a whale address
   * @param {string} address - Whale wallet address
   * @param {number} limit - Max transactions to fetch (default: 10)
   * @returns {Array} Array of transaction objects
   */
  async fetchWhaleTransactions(address, limit = 10) {
    try {
      if (!this.apiKey) {
        console.warn('[NansenService] API key not configured. Skipping whale check.');
        return [];
      }

      if (!address || !address.startsWith('0x')) {
        console.error('[NansenService] Invalid wallet address');
        return [];
      }

      console.log(`[NansenService] Fetching whale transactions for ${address.substring(0, 6)}...`);

      const response = await this.client.get(`${this.baseUrl}/wallet/transaction_history`, {
        params: {
          address: address,
          limit: limit,
          sort_by: 'timestamp',
          sort_order: 'desc'
        }
      });

      const transactions = response.data.transactions || [];

      console.log(`[NansenService] Found ${transactions.length} transactions for whale ${address.substring(0, 6)}...`);

      return transactions;
    } catch (error) {
      console.error(`[NansenService] Error fetching whale data for ${address}:`, error.message);

      // Return empty array on error - don't break the app
      return [];
    }
  }

  /**
   * Get whale profile/label information
   * @param {string} address - Whale wallet address
   * @returns {Object|null} Whale profile data or null
   */
  async getWhaleProfile(address) {
    try {
      if (!this.apiKey) {
        console.warn('[NansenService] API key not configured');
        return null;
      }

      if (!address || !address.startsWith('0x')) {
        console.error('[NansenService] Invalid wallet address');
        return null;
      }

      console.log(`[NansenService] Fetching whale profile for ${address.substring(0, 6)}...`);

      const response = await this.client.get(`${this.baseUrl}/wallet/profile`, {
        params: { address }
      });

      return response.data || null;
    } catch (error) {
      console.error('[NansenService] Error fetching whale profile:', error.message);
      return null;
    }
  }

  /**
   * Check if whale has significant activity
   * @param {string} address - Whale wallet address
   * @param {number} threshold - USD threshold for "significant"
   * @returns {boolean} True if whale has significant recent activity
   */
  async hasSignificantActivity(address, threshold = 10000) {
    try {
      const transactions = await this.fetchWhaleTransactions(address, 5); // Check last 5 txns

      return transactions.some(tx =>
        parseFloat(tx.usd_value || 0) >= threshold
      );
    } catch (error) {
      console.error('[NansenService] Error checking whale activity:', error.message);
      return false;
    }
  }

  /**
   * Get whale activity summary
   * @param {string} address - Whale wallet address
   * @returns {Object} Summary of whale activity
   */
  async getWhaleActivitySummary(address) {
    try {
      const transactions = await this.fetchWhaleTransactions(address, 20);
      const profile = await this.getWhaleProfile(address);

      const totalVolume = transactions.reduce((sum, tx) =>
        sum + parseFloat(tx.usd_value || 0), 0
      );

      const avgTransaction = totalVolume / Math.max(transactions.length, 1);

      return {
        address,
        totalTransactions: transactions.length,
        totalVolume,
        avgTransaction,
        profile,
        lastActivity: transactions[0]?.timestamp || null
      };
    } catch (error) {
      console.error('[NansenService] Error getting whale summary:', error.message);
      return {
        address,
        totalTransactions: 0,
        totalVolume: 0,
        avgTransaction: 0,
        profile: null,
        lastActivity: null
      };
    }
  }
}

export default new NansenService();
