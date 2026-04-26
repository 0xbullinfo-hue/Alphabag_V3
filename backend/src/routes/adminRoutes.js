
import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import {
    getSystemStats, getUsers,
    createNews, deleteNews,
    createSignal, updateSignal, deleteSignal,
    getWhaleFollows, addWhaleFollow, deleteWhaleFollow,
    getAdminSettings, updateAdminSettings, sendTestAlert
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require Admin privileges
router.use(verifyToken, verifyAdmin);

// Dashboard
router.get('/system', getSystemStats);
router.get('/users', getUsers);

// News Management
router.post('/news', createNews);
router.delete('/news/:id', deleteNews);

// Signals
router.post('/signals', createSignal);
router.put('/signals/:id', updateSignal);
router.delete('/signals/:id', deleteSignal);

// Whale Watch & Settings
router.get('/whales', getWhaleFollows);
router.post('/whales', addWhaleFollow);
router.delete('/whales/:id', deleteWhaleFollow);

router.get('/settings', getAdminSettings);
router.post('/settings', updateAdminSettings);
router.post('/test-alert', sendTestAlert);
router.post('/reboot', (req, res) => res.json({ success: true, message: 'Reboot simulated safely.' }));

export default router;
