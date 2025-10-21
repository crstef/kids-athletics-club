/**
 * Passenger/Node.js entry point
 * This file is required by Passenger to start the application
 * It loads environment variables and starts the Express server
 */

const path = require('path');

// Load environment variables from .env.production (production) or .env (development)
// Use absolute path to ensure it works from any working directory
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'server/.env.production')
  : path.join(__dirname, 'server/.env');

require('dotenv').config({ path: envPath });

// Log environment loading (for debugging)
if (process.env.NODE_ENV === 'production') {
  console.log(`[app.cjs] Loaded environment from: ${envPath}`);
  console.log(`[app.cjs] DB_USER: ${process.env.DB_USER}`);
}

// Start the Express application
const app = require('./server/dist/index.js');

module.exports = app;
