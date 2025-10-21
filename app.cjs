/**
 * Passenger/Node.js entry point
 * This file is required by Passenger to start the application
 * It loads environment variables and starts the Express server
 */

// Load environment variables from .env.production (production) or .env (development)
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? './server/.env.production' 
    : './server/.env'
});

// Start the Express application
const app = require('./server/dist/index.js');

module.exports = app;
