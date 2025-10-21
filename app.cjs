/**
 * Passenger/Node.js entry point
 * This file is required by Passenger to start the application
 * It loads environment variables and starts the Express server
 */

const path = require('path');
const fs = require('fs');

// Always try to load .env.production first (for production deployments)
// Fall back to .env if .env.production doesn't exist (for development)
const envProduction = path.join(__dirname, 'server/.env.production');
const envDevelopment = path.join(__dirname, 'server/.env');

let envPath;
if (fs.existsSync(envProduction)) {
  envPath = envProduction;
} else if (fs.existsSync(envDevelopment)) {
  envPath = envDevelopment;
} else {
  console.warn('[app.cjs] WARNING: No .env file found!');
  envPath = envProduction; // Set path anyway, dotenv will handle gracefully
}

require('dotenv').config({ path: envPath });

// Log environment loading (for debugging)
console.log(`[app.cjs] Loaded environment from: ${envPath}`);
console.log(`[app.cjs] DB_HOST: ${process.env.DB_HOST}`);
console.log(`[app.cjs] DB_USER: ${process.env.DB_USER}`);
console.log(`[app.cjs] DB_NAME: ${process.env.DB_NAME}`);

// Start the Express application
const appModule = require('./server/dist/index.js');
const app = appModule.default || appModule;

module.exports = app;
