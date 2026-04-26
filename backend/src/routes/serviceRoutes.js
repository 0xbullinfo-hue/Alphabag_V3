
import express from 'express';
import { getPrices, searchCoins } from '../controllers/marketController.js';
import { getTopHolders, followWhale } from '../controllers/whaleController.js';
import { getBriefing, analyzePortfolio, streamNeuralCore } from '../controllers/aiController.js';
import { getHistory, saveSnapshot } from '../controllers/historyController.js';
import { getBalances } from '../controllers/portfolioController.js';

const marketRouter = express.Router();
marketRouter.get('/prices', getPrices);
marketRouter.get('/search', searchCoins);

const whaleRouter = express.Router();
whaleRouter.get('/top-holders', getTopHolders);
whaleRouter.post('/follow', followWhale);

const aiRouter = express.Router();
aiRouter.post('/briefing', getBriefing);
aiRouter.post('/analyze', analyzePortfolio);
aiRouter.post('/neural-core', streamNeuralCore);

const portfolioRouter = express.Router();
portfolioRouter.get('/history', getHistory);
portfolioRouter.get('/balances', getBalances);
portfolioRouter.post('/snapshot', saveSnapshot);

export { marketRouter, whaleRouter, aiRouter, portfolioRouter };
