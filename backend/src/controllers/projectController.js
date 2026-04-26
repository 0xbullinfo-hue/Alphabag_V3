import { store } from '../services/storeService.js';

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

export const submitManifesto = async (req, res) => {
    const { name, symbol, contractAddress, theHook, description, totalSupply, websiteUrl, buyLink, manifestoText } = req.body;
    const user = req.user;

    if (user.tier !== 'ULTIMATE' && user.role !== 'FOUNDER' && user.accountType !== 'FOUNDER') {
        return res.status(403).json({ error: 'Only Founders can drop a Project Manifesto.' });
    }

    if (!isValidUrl(websiteUrl) || !isValidUrl(buyLink)) {
        return res.status(400).json({ error: 'Invalid URL provided for website or buy link.' });
    }

    try {
        // Enforce 1:1 Relationship
        const existingProject = await store.findOne('projects', { ownerId: user.id });
        if (existingProject) {
            return res.status(400).json({ error: 'Founder already has an active project. Use Edit Manifesto instead.' });
        }

        const newProject = {
            ownerId: user.id,
            name,
            tickerSymbol: symbol,
            contractAddress,
            theHook: theHook || '',
            description: description || '',
            totalSupply: totalSupply || '0',
            websiteUrl,
            buyLink,
            manifestoText: manifestoText || {},
            heatIndex: 0,
            engagementTotal: 0,
            totalMentions: 0,
            isVerified: false
        };

        const saved = await store.create('projects', newProject);
        res.json({ success: true, project: saved });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: 'Internal server error while saving project.' });
    }
};

export const getProjects = async (req, res) => {
    try {
        const projects = await store.read('projects');
        
        const sorted = projects.sort((a,b) => (b.heatIndex || 0) - (a.heatIndex || 0));
        
        const rankedProjects = sorted.map((p, index) => ({
            ...p,
            symbol: p.tickerSymbol,
            rank: index + 1
        }));
        
        res.json(rankedProjects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: 'Internal server error fetching projects.' });
    }
};

export const getProjectByOwner = async (req, res) => {
    const { ownerId } = req.params;
    try {
        const project = await store.findOne('projects', { ownerId: ownerId });
        
        if (!project) return res.status(404).json({ error: 'No manifesto found for this founder.' });
        
        res.json({
            ...project,
            symbol: project.tickerSymbol
        });
    } catch (error) {
         console.error("Error fetching project:", error);
         res.status(500).json({ error: 'Internal server error fetching project.' });
    }
};
