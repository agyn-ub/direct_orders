const WebSocket = require('ws');

let specialClient = null;
const SPECIAL_CLIENT_ID = '12345678';

// Format items array into string with format: name@price@quantity##name@price@quantity
function formatItemsToString(items) {
    return items
        .map(item => `${item.name}@${item.price}@${item.quantity}`)
        .join('##');
}

// Handle special client connection
function handleSpecialClient(ws, items) {
    specialClient = ws;
    console.log('Special client connected.');
    
    if (Array.isArray(items)) {
        const formattedString = formatItemsToString(items);
        console.log('Items sent to special client:', formattedString);
        ws.send(formattedString);
    }
    ws.send('Registered as special client.');
}

// Handle regular client connection
function handleRegularClient(ws, contractNumber, items) {
    console.log('Message from regular client:', { contractNumber, items });
    
    if (Array.isArray(items)) {
        const formattedString = contractNumber + '@@@@' + formatItemsToString(items);
        console.log('Items sent to simple client:', formattedString);
        ws.send(formattedString);

        // Forward to special client if connected
        if (specialClient?.readyState === WebSocket.OPEN) {
            console.log('Forwarding items to special client');
            specialClient.send(formattedString);
        } else {
            console.warn('Special client not connected.');
        }
    }
}

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');
        ws.send('Добро пожаловать вебсокет сервер!');

        ws.on('message', (message) => {
            console.log(`Received message: ${message}`);
            try {
                const { clientId, contractNumber, items } = JSON.parse(message);

                if (clientId === SPECIAL_CLIENT_ID) {
                    handleSpecialClient(ws, items);
                } else {
                    handleRegularClient(ws, contractNumber, items);
                }
            } catch (err) {
                console.error('Error processing message:', err);
                ws.send('Error: Invalid message format.');
            }
        });

        ws.on('close', () => {
            if (ws === specialClient) {
                console.log('Special client disconnected.');
                specialClient = null;
            } else {
                console.log('A regular client disconnected.');
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    });

    return wss;
}

module.exports = setupWebSocket;
