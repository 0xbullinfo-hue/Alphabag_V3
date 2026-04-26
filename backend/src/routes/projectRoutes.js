
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { submitManifesto, getProjects, getProjectByOwner } from '../controllers/projectController.js';

const router = express.Router();

router.post('/manifesto', verifyToken, submitManifesto);
router.get('/screener', getProjects);
router.get('/:ownerId', getProjectByOwner);

export default router;
