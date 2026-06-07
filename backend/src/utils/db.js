import { config } from '../config/env.js';

export const connectDB = async () => {
    try {
        console.log('✅ Local JSON Data Store Active (PostgreSQL Migration Pending)');
    } catch (error) {
        console.error('❌ Data Store Error:', error);
    }
};
