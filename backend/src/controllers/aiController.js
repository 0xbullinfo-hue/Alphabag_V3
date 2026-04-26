
import axios from 'axios';
import { config } from '../config/env.js';
import { store } from '../services/storeService.js';

// Cache analysis results to avoid excessive API calls
// user_id -> { analysis, timestamp }
const analysisCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper to call Gemini
const callGemini = async (prompt, key) => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        });

        return response.data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error('[AI] Gemini Call Error:', e.response ? e.response.data : e.message);
        return null;
    }
};

export const analyzePortfolio = async (req, res) => {
    try {
        const { portfolio, totalValue } = req.body;
        const userId = req.user ? req.user.id : 'guest';

        // 1. Check Cache
        if (analysisCache.has(userId)) {
            const cached = analysisCache.get(userId);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                return res.json(cached.analysis);
            }
        }

        // 2. API Key Check
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(503).json({ error: 'AI Analysis Node Offline. Please configure API Key.' });
        }

        // 3. Prepare Prompt
        const assetsSummary = portfolio.map(p => `${p.symbol}: $${p.value}`).join(', ');
        const prompt = `
            Analyze this crypto portfolio worth $${totalValue}. Assets: ${assetsSummary}.
            Provide a JSON response with:
            - "riskScore" (1-10 number)
            - "diversificationScore" (1-10 number)
            - "summary" (max 2 sentences, professional but witty crypto persona).
            - "label" (e.g. "Degen", "Whale", "Safe", "Balanced").
            Do not include markdown formatting, just raw JSON.
        `;

        // 4. Call AI
        let analysis;
        const text = await callGemini(prompt, apiKey);
        if (text) {
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            analysis = JSON.parse(jsonText);
        }

        // 5. Cache & Respond
        if (analysis) {
            analysisCache.set(userId, { analysis, timestamp: Date.now() });
            res.json(analysis);
        } else {
            res.status(500).json({ error: 'Failed to synthesize analysis' });
        }

    } catch (error) {
        console.error('[AI] Analysis failed:', error.message);
        res.status(500).json({ error: 'Analysis protocol failure' });
    }
};

export const getBriefing = async (req, res) => {
    try {
        const { assets, userMessage, tier } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(503).json({ briefing: "Neural link offline. Admin authorization required to enable AI services." });
        }

        const assetsSummary = assets ? assets.map(p => `${p.symbol}: ${p.amount}`).join(', ') : 'No assets';
        const prompt = `
            You are AlphaAi, a professional crypto portfolio assistant.
            User Tier: ${tier}.
            User Portfolio: ${assetsSummary}.
            User Query: "${userMessage}"
            
            Provide a helpful, insightful response (max 3 sentences). 
        `;

        const text = await callGemini(prompt, apiKey);
        res.json({ briefing: text || "Neural core failed to respond." });

    } catch (error) {
        console.error('[AI] Briefing failed:', error.message);
        res.status(500).json({ briefing: "Neural uplink failed. Please try again." });
    }
};

export const streamNeuralCore = async (req, res) => {
    const { prompt } = req.body;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
        res.write("Neural link offline. Please configure API Key in the backend environment.");
        return res.end();
    }

    try {
        const text = await callGemini(prompt + " (Respond as AlphaAi)", apiKey);
        if (text) {
            const chunks = text.split(/(\s+)/);
            for (const chunk of chunks) {
                res.write(chunk);
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        } else {
            res.write("Neural core failed to synthesize a response.");
        }
    } catch (e) {
        res.write("Neural Sync Error: " + e.message);
    } finally {
        res.end();
    }
};
