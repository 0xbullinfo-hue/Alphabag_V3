import express from 'express';
import { proxyBlockExplorer } from '../controllers/proxyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route: /api/proxy/:explorer
// Example: /api/proxy/etherscan?module=account&action=balance...
// Secured with requireAuth if needed, but since it's just proxying block explorers,
// we might want to restrict it or limit it. We'll use requireAuth to ensure only logged-in users can use our keys.
router.get('/:explorer', requireAuth, proxyBlockExplorer);

export default router;
