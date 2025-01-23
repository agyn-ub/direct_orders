const WebSocket = require('ws');

let specialClient = null;

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.send('Добро пожаловать вебсокет сервер!');

        ws.on('message', (message) => {
            console.log(`Received message: ${message}`);
            try {
                const parsedMessage = JSON.parse(message);
                const { clientId, contractNumber, items } = parsedMessage;

                if (clientId === '12345678') {
                    specialClient = ws;
                    console.log('Special client connected.');
                    if (Array.isArray(items)) {
                        console.log('Received array of items:', items);
                        ws.send(JSON.stringify(items));
                    }
                    ws.send('Registered as special client.');
                } else {
                    console.log('Message from regular client:', { name, quantity, contractNumber, items });
                    // const responseMessage = `${name}@${quantity}@${contractNumber}`;
                    // ws.send(responseMessage);
                    if (Array.isArray(items)) {
                        console.log('Received array of items:', items);
                        ws.send(JSON.stringify(items));
                    }

                    if (specialClient && specialClient.readyState === WebSocket.OPEN) {
                        if (Array.isArray(items)) {
                            console.log('Received array of items:', items);
                            specialClient.send(JSON.stringify(items));
                        }
                    } else {
                        console.warn('Special client not connected.');
                    }
                }
            } catch (err) {
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
