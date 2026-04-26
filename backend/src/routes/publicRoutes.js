
import express from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { getNews, getSignals } from '../controllers/publicController.js'; // Wait, I meant to separate this logic? 

// Actually, I put getters in publicController.js in previous step? Yes. 
// But I need to define the routes here.

// I previously defined getNews and getSignals in publicController.js
// Let's import them.

// Wait, I might have made a mistake in creating publicController.js vs adminController.js
// Let's check my memory. I created adminController with getters for admin-side.
// And publicController with getNews and getSignals.
// Yes.

const router = express.Router();

router.get('/news', getNews);
router.get('/signals', optionalAuth, getSignals);

export default router;
