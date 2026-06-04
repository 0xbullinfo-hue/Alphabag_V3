/**
 * ALPHABAG V3 - CENTRALIZED PRODUCTION CONFIGURATION
 * 
 * All configuration values loaded from environment variables
 * No hardcoded values in code - everything is config-driven
 * 
 * Supports:
 * - Testnet (all features enabled, token gating disabled)
 * - Mainnet (real token gating, premium features)
 * - Feature flags for gradual rollout
 */

export const TOKEN_GATING_CONFIG = {
  // ===== TOKEN CONTRACT ADDRESSES =====
  // Empty until BAG token is deployed
  // Updated at deployment time via environment variables
  
  BAG_TOKEN_ADDRESS_MAINNET: import.meta.env.VITE_BAG_TOKEN_ADDRESS_MAINNET || '',
  BAG_TOKEN_ADDRESS_TESTNET: import.meta.env.VITE_BAG_TOKEN_ADDRESS_TESTNET || '',
  
  // ===== PREMIUM ACCESS REQUIREMENTS =====
  // Minimum BAG tokens required to unlock premium features
  // Set to 0 (or not set) to disable token gating
  MIN_BAG_REQUIRED: Number(import.meta.env.VITE_MIN_BAG_REQUIRED) || 0,
  
  // ===== ADMIN WALLET CONFIGURATION =====
  // Comma-separated list of admin wallet addresses
  // Format: "0x1234...,0x5678...,0xabcd..."
  // Centralized single source of truth - replaces hardcoded wallets everywhere
  ADMIN_WALLETS: (import.meta.env.VITE_ADMIN_WALLETS || '')
    .split(',')
    .map((w: string) => w.trim())
    .filter(Boolean),
  
  // ===== FEATURE FLAGS =====
  // Toggle token gating on/off
  // TESTNET: false (all users get premium for testing)
  // MAINNET: true (real token verification required)
  ENABLE_TOKEN_GATING: import.meta.env.VITE_ENABLE_TOKEN_GATING === 'true',
  
  // Production vs Testnet detection
  IS_PRODUCTION: import.meta.env.VITE_ENVIRONMENT === 'production',
};

export const BLOCKCHAIN_CONFIG = {
  // Chain IDs
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
  ETH_MAINNET: 1,
  POLYGON_MAINNET: 137,
  ARBITRUM_MAINNET: 42161,
  BASE_MAINNET: 8453,
  
  // Default chain (BSC is primary)
  DEFAULT_CHAIN: 56,
};

export const API_CONFIG = {
  // ===== PREMIUM API KEYS =====
  // These are optional for testnet but required for mainnet features
  
  // Nansen - Real whale transaction tracking
  NANSEN_API_KEY: import.meta.env.VITE_NANSEN_API_KEY || '',
  
  // Block Explorer APIs - Real transaction history
  ETHERSCAN_API_KEY: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
  BSCSCAN_API_KEY: import.meta.env.VITE_BSCSCAN_API_KEY || '',
  
  // Rate limiting considerations
  // Etherscan free tier: ~5 calls/sec
  // BscScan free tier: ~10 calls/sec
  // Implement caching to avoid hitting limits
};

// ===== TIME CONSTANTS =====
export const ONE_SECOND = 1000;
export const ONE_MINUTE = 60 * ONE_SECOND;
export const ONE_HOUR = 60 * ONE_MINUTE;
export const ONE_DAY = 24 * ONE_HOUR;

// ===== FEATURE LIMITS =====
// Tier-based limits for portfolios & whale tracking
export const TIER_LIMITS = {
  FREE: {
    maxPortfolios: 5,
    maxWhales: 3,
    refreshInterval: 5 * ONE_MINUTE, // 5 min refresh for free
  },
  PREMIUM: {
    maxPortfolios: 100,
    maxWhales: 50,
    refreshInterval: 2 * ONE_MINUTE, // 2 min refresh for premium
  },
} as const;

// ===== ERROR MESSAGES =====
export const ERROR_MESSAGES = {
  TOKEN_CHECK_FAILED: 'Failed to verify premium status. Please refresh or contact support.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  PREMIUM_REQUIRED: 'This feature requires a premium subscription.',
  INSUFFICIENT_BALANCE: 'You do not have enough BAG tokens for premium access.',
};

// ===== VALIDATION =====
export function validateConfig() {
  const errors: string[] = [];

  // Warn if token gating enabled but no token address
  if (TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
    if (!TOKEN_GATING_CONFIG.BAG_TOKEN_ADDRESS_MAINNET) {
      errors.push('⚠️ Token gating enabled but BAG_TOKEN_ADDRESS_MAINNET not set');
    }
    if (!TOKEN_GATING_CONFIG.MIN_BAG_REQUIRED || TOKEN_GATING_CONFIG.MIN_BAG_REQUIRED <= 0) {
      errors.push('⚠️ Token gating enabled but MIN_BAG_REQUIRED not configured');
    }
  }

  // Warn if no admin wallets configured
  if (TOKEN_GATING_CONFIG.ADMIN_WALLETS.length === 0) {
    console.warn('⚠️ No admin wallets configured. Admin features will be unavailable.');
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }

  return errors.length === 0;
}

// Validate on load (dev only)
if (import.meta.env.DEV) {
  validateConfig();
}

// ===== DEPLOYMENT GUIDE =====
/*
ENVIRONMENT VARIABLES REQUIRED:

For Testnet (All features available, no token check):
  VITE_ENVIRONMENT=testnet
  VITE_ENABLE_TOKEN_GATING=false
  VITE_BAG_TOKEN_ADDRESS_TESTNET= (empty - not deployed yet)
  VITE_ADMIN_WALLETS=0x42916A998c6Bff7F36bE61749Bd1BBA9f473dB96

For Mainnet (Real token gating, premium features):
  VITE_ENVIRONMENT=production
  VITE_ENABLE_TOKEN_GATING=true
  VITE_BAG_TOKEN_ADDRESS_MAINNET=0x... (deployed token address)
  VITE_MIN_BAG_REQUIRED=1000
  VITE_NANSEN_API_KEY=your_key
  VITE_ETHERSCAN_API_KEY=your_key
  VITE_BSCSCAN_API_KEY=your_key
  VITE_ADMIN_WALLETS=0x...,0x...

Update in .env or .env.local file in root directory.
*/
