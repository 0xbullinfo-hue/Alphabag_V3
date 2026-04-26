import express from 'express';
import { 
    getTreasuryStatus, getUserEarnProfile, getMissions, 
    getActivityFeed, streamActivity, getLeaderboard, 
    claimMission, requestBagPayout, updatePreferredWallet, adjustTreasuryBalance,
    createMission, getAdminTokenRequests, approveTokenRequest, getAdminActivity
} from '../controllers/t2eController.js';
import { verifyToken, verifyAdmin, optionalAuth } from '../middleware/authMiddleware.js';
const router = express.Router();

// Public / Guest Routes
router.get('/treasury-status', optionalAuth, getTreasuryStatus);
router.get('/missions',         optionalAuth, getMissions);        // ?page=1&limit=20&type=SOCIAL
router.get('/activity-feed',    optionalAuth, getActivityFeed);
router.get('/activity-stream',  optionalAuth, streamActivity);
router.get('/leaderboard',      optionalAuth, getLeaderboard);

// Protected User Routes
router.get('/user/profile',   verifyToken, getUserEarnProfile);
router.post('/claim',         verifyToken, claimMission);
router.post('/request-payout', verifyToken, requestBagPayout);
router.patch('/user/wallet',  verifyToken, updatePreferredWallet);

// Admin Routes
router.patch('/admin/adjust-balance', verifyToken, verifyAdmin, adjustTreasuryBalance);
router.post('/admin/missions',        verifyToken, verifyAdmin, createMission);
router.get('/admin/token-requests',   verifyToken, verifyAdmin, getAdminTokenRequests);
router.post('/admin/token-requests/:id/approve', verifyToken, verifyAdmin, approveTokenRequest);
router.get('/admin/activity',         verifyToken, verifyAdmin, getAdminActivity);

export default router;
