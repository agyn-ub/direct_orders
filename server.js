require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const http = require('http'); // Use HTTP server for WebSocket compatibility
const app = express();

const itemsRoutes = require('./routes/items'); // Import items routes
const clientRoutes = require('./routes/clients'); // Import clients routes
const { initializeDb } = require('./utils/db'); // Import initializeDb
const setupWebSocket = require('./ws/websocket'); // Import WebSocket setup

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use('/items', itemsRoutes(pool)); // Use the items routes
app.use('/clients', clientRoutes(pool)); // Use the clients routes

const PORT = process.env.PORT || 3000;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Set up WebSocket server
setupWebSocket(server);

initializeDb(pool).then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
