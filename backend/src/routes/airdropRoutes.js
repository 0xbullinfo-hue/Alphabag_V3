import express from 'express';
import { 
    getAirdropStatus, claimPoints, submitWallet, getCampaigns, createCampaign, updateCampaign, deleteCampaign, 
    getTasks, completeTask, getAdminTasks, upsertTask, deleteTask, processReferralSnapshot,
    getAirdropStats, getSubmittedWallets, resetAirdrop, toggleReveal, approveFounder, grantBonusXP,
    pauseMission, getMissionStatus, exportMissionData, fullMissionWipe
} from '../controllers/airdropController.js';
import { optionalAuth, verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/User Routes
router.get('/status', optionalAuth, getAirdropStatus);
router.get('/stats', optionalAuth, getAirdropStats);
router.post('/claim', verifyToken, claimPoints);
router.post('/submit-wallet', verifyToken, submitWallet);
router.get('/tasks', optionalAuth, getTasks);
router.post('/tasks/complete', verifyToken, completeTask);

// Admin Routes - Campaigns
router.get('/admin/campaigns', verifyToken, verifyAdmin, getCampaigns);
router.post('/admin/campaigns', verifyToken, verifyAdmin, createCampaign);
router.put('/admin/campaigns/:id', verifyToken, verifyAdmin, updateCampaign);
router.delete('/admin/campaigns/:id', verifyToken, verifyAdmin, deleteCampaign);

// Admin Routes - Global
router.get('/admin/wallets', verifyToken, verifyAdmin, getSubmittedWallets);
router.post('/admin/reset', verifyToken, verifyAdmin, resetAirdrop);
router.post('/admin/reveal', verifyToken, verifyAdmin, toggleReveal);
router.get('/admin/tasks', verifyToken, verifyAdmin, getAdminTasks);
router.post('/admin/tasks', verifyToken, verifyAdmin, upsertTask);
router.delete('/admin/tasks/:id', verifyToken, verifyAdmin, deleteTask);
router.post('/admin/snapshot-referrals', verifyToken, verifyAdmin, processReferralSnapshot);
router.post('/admin/approve-founder', verifyToken, verifyAdmin, approveFounder);
router.post('/admin/bonus-xp', verifyToken, verifyAdmin, grantBonusXP);

// Admin Routes - Mission Lifecycle
router.get('/admin/mission-status', verifyToken, verifyAdmin, getMissionStatus);
router.post('/admin/pause-mission', verifyToken, verifyAdmin, pauseMission);
router.get('/admin/export', verifyToken, verifyAdmin, exportMissionData);
router.post('/admin/full-wipe', verifyToken, verifyAdmin, fullMissionWipe);

export default router;
