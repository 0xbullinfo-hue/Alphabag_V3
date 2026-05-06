/**
 * TOKEN GATING MIDDLEWARE
 * Protects premium routes by verifying token balance
 * 
 * Usage:
 * router.get('/api/premium-feature', tokenGatingMiddleware, (req, res) => { ... })
 */

import { TOKEN_GATING_CONFIG } from '../config/tokenGatingConfig.js';

/**
 * Middleware to check if user holds sufficient tokens
 * Expects req.user.wallet to be set by auth middleware
 */
export const tokenGatingMiddleware = async (req, res, next) => {
  try {
    // Skip if token gating is disabled
    if (!TOKEN_GATING_CONFIG.ENABLE_TOKEN_GATING) {
      return next();
    }

    // User must be authenticated
    if (!req.user || !req.user.wallet) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userWallet = req.user.wallet.toLowerCase();

    // TODO: Implement token balance verification
    // This should call a service to check the user's BAG token balance
    // For now, we'll just allow authenticated users
    
    console.log(`✅ Token gating check passed for ${userWallet}`);
    next();
  } catch (error) {
    console.error('Token gating middleware error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
};

/**
 * Middleware to check if user is an admin
 * Admin wallets configured in TOKEN_GATING_CONFIG
 */
export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.user.wallet) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userWallet = req.user.wallet.toLowerCase();
    const adminWallets = TOKEN_GATING_CONFIG.ADMIN_WALLETS.map(w => w.toLowerCase());

    if (!adminWallets.includes(userWallet)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`✅ Admin access granted for ${userWallet}`);
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};
