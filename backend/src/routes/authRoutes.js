
import express from 'express';
import { login, register, siweAuth, getReferrals, getMe, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/siwe', siweAuth);
router.get('/me', verifyToken, getMe);
router.get('/referrals', verifyToken, getReferrals);
router.post('/update-profile', verifyToken, updateProfile);

export default router;
