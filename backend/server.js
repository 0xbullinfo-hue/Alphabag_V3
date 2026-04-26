// server.js handles initialization and listening
import app from './src/app.js';
import { config } from './src/config/env.js';
import './cron/check_followed_whales.js';
import './cron/heatIndexCron.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`\n[SYSTEM] AlphaBAG Infrastructure Active`);
  console.log(`[SYSTEM] Port: ${PORT} (Source: ${process.env.PORT ? '.env' : 'Default/Config'})`);
  console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!config.jwtSecret || config.jwtSecret.includes('urgent')) {
    console.warn(`[WARNING] Using non-secure or default JWT Secret.`);
  }
});
