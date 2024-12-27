const express = require('express');
const WebSocket = require('ws');
const path = require('path');

// Create an Express app
const app = express();

// Use the port from Heroku or fallback to 3000 locally
const port = process.env.PORT || 3000;

// Serve static files (like the HTML file) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Start the Express server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Create the WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Store the special client with id 12345678
let specialClient = null; // Holds the WebSocket connection for client ID 12345678

// When a new client connects, listen for messages
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Send a welcome message to the client
  ws.send('Добро пожаловать вебсокет сервер!');

  // Listen for incoming messages from the client
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    try {
      // Parse the incoming message as JSON
      const parsedMessage = JSON.parse(message);

      const { clientId, type, name, quantity, contractNumber, items } = parsedMessage;

          // Handle special client registration (client ID 12345678)
          if (clientId === '12345678') {
            specialClient = ws;
            console.log('Клиент с ID 12345678 подключен как специальный клиент.');
            if (Array.isArray(items)) {
              // Handle the array of items
              console.log('Received array of items:', items);
              ws.send(JSON.stringify(items));
            }
            ws.send('Вы зарегистрированы как 1С база данных');
          } else {
            // Handle messages from regular clients
            console.log('Message from regular client:', { name, quantity, contractNumber });

            // Send a string to the client with '@' separator
            const responseMessage = `${name}@${quantity}@${contractNumber}`;
            ws.send(responseMessage);

            // Forward the string message to the special client if connected
            if (specialClient && specialClient.readyState === WebSocket.OPEN) {
              specialClient.send(responseMessage);
            } else {
              console.warn('Special client (12345678) is not connected.');
            }
          }
    } catch (err) {
      // If the message is not valid JSON, notify the client
      ws.send('Error: Invalid message format. Expected JSON format: { clientId, type, name, quantity }');
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    if (ws === specialClient) {
      console.log('Special client disconnected.');
      specialClient = null; // Clear the reference to the special client
    } else {
      console.log('A regular client disconnected.');
    }
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
