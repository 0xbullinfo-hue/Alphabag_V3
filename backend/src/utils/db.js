import mongoose from 'mongoose';
import { config } from '../config/env.js';

export const connectDB = async () => {
    try {
        if (!config.databaseUrl) {
            console.warn('⚠️ No DATABASE_URL found in environment variables. Running without MongoDB connection.');
            return;
        }

        if (!config.databaseUrl.startsWith('mongodb://') && !config.databaseUrl.startsWith('mongodb+srv://')) {
            console.warn('⚠️ DATABASE_URL is not a MongoDB connection string. Skipping Mongoose connection.');
            return;
        }

        await mongoose.connect(config.databaseUrl);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        // Do not exit process, let the app try to run
        // process.exit(1); 
    }
};
