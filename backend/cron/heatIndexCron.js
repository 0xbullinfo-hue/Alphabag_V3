import cron from 'node-cron';
import { store } from '../src/services/storeService.js';

// Run every 10 minutes to recalculate Heat Index for all projects
cron.schedule('*/10 * * * *', async () => {
    console.log('--- [CRON] Recalculating Project Heat Indices ---');
    try {
        const projects = await store.read('projects');
        if (!projects || projects.length === 0) return;

        for (const project of projects) {
            // Priority logic: 1 mention = 1 point, 1 engagement = 2 points
            // Bonus points if verified
            let newHeat = (project.totalMentions * 1) + (project.engagementTotal * 2);
            if (project.isVerified) newHeat += 20;

            // Cap heat index at 100 for visual consistency on frontend
            newHeat = Math.min(newHeat, 100);

            if (newHeat !== project.heatIndex) {
                await store.update(
                    'projects',
                    p => p.id === project.id,
                    () => ({ heatIndex: newHeat })
                );
            }
        }
    } catch (error) {
        console.error('[CRON] Error updating Heat Indices:', error);
    }
});
