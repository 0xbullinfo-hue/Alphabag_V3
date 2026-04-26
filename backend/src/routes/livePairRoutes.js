import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import * as livePairController from '../controllers/livePairController.js';

const router = express.Router();

router.get('/', livePairController.getLivePairs);
router.post('/submit', verifyToken, livePairController.submitPair);

export default router;
