import express from 'express';
import { 
    getAirdropStatus, claimPoints, submitWallet, getCampaigns, createCampaign, updateCampaign, deleteCampaign, 
    getAdminTasks, upsertTask, deleteTask, processReferralSnapshot,
    getAirdropStats, getSubmittedWallets, resetAirdrop, toggleReveal, approveFounder, grantBonusXP,
    pauseMission, getMissionStatus, exportMissionData, fullMissionWipe, updateTgeDate,
    convertItemsToBag, issueStrike, unbanUser, getStrikeLog
} from '../controllers/airdropController.js';
import { 
    getMissions, claimMission, requestBagPayout,
    getAdminMissions, upsertMission, deleteMission
} from '../controllers/t2eController.js';
import { optionalAuth, verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/User Routes
router.get('/status', optionalAuth, getAirdropStatus);
router.get('/stats', optionalAuth, getAirdropStats);
router.post('/claim', verifyToken, claimPoints);
router.post('/submit-wallet', verifyToken, submitWallet);
router.post('/convert', verifyToken, convertItemsToBag);
router.post('/payout', verifyToken, requestBagPayout);
router.get('/tasks', optionalAuth, getMissions);
router.post('/tasks/complete', verifyToken, claimMission);

// Admin Routes - Campaigns
router.get('/admin/campaigns', verifyToken, verifyAdmin, getCampaigns);
router.post('/admin/campaigns', verifyToken, verifyAdmin, createCampaign);
router.put('/admin/campaigns/:id', verifyToken, verifyAdmin, updateCampaign);
router.delete('/admin/campaigns/:id', verifyToken, verifyAdmin, deleteCampaign);

// Admin Routes - Global
router.get('/admin/wallets', verifyToken, verifyAdmin, getSubmittedWallets);
router.post('/admin/reset', verifyToken, verifyAdmin, resetAirdrop);
router.post('/admin/reveal', verifyToken, verifyAdmin, toggleReveal);
router.get('/admin/tasks', verifyToken, verifyAdmin, getAdminMissions);
router.post('/admin/tasks', verifyToken, verifyAdmin, upsertMission);
router.delete('/admin/tasks/:id', verifyToken, verifyAdmin, deleteMission);
router.post('/admin/snapshot-referrals', verifyToken, verifyAdmin, processReferralSnapshot);
router.post('/admin/approve-founder', verifyToken, verifyAdmin, approveFounder);
router.post('/admin/bonus-xp', verifyToken, verifyAdmin, grantBonusXP);
router.post('/admin/strike', verifyToken, verifyAdmin, issueStrike);
router.post('/admin/unban', verifyToken, verifyAdmin, unbanUser);
router.get('/admin/strikes', verifyToken, verifyAdmin, getStrikeLog);

// Admin Routes - Mission Lifecycle
router.get('/admin/mission-status', verifyToken, verifyAdmin, getMissionStatus);
router.post('/admin/pause-mission', verifyToken, verifyAdmin, pauseMission);
router.post('/admin/tge-date', verifyToken, verifyAdmin, updateTgeDate);
router.get('/admin/export', verifyToken, verifyAdmin, exportMissionData);
router.post('/admin/full-wipe', verifyToken, verifyAdmin, fullMissionWipe);

export default router;
