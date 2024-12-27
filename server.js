const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const setupWebSocket = require('./ws/websocket');
const apiRoutes = require('./routes/api');

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// REST API routes
app.use('/api', apiRoutes);

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// WebSocket setup
setupWebSocket(server);
