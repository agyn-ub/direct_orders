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
                        const formattedString = items
                            .map(item => `${item.name}@${item.price}@${item.quantity}`)
                            .join('##');
                        console.log('Items sent to special client:', formattedString);
                        ws.send(formattedString);
                    }
                    ws.send('Registered as special client.');
                } else {
                    console.log('Message from regular client:', {contractNumber, items });
                    
                    if (Array.isArray(items)) {
                        const formattedString = items
                            .map(item => `${item.name}@${item.price}@${item.quantity}`)
                            .join('##');
                        console.log('Items sent to simple client:', formattedString);
                        ws.send(formattedString);
                    }

                    if (specialClient && specialClient.readyState === WebSocket.OPEN) {
                        if (Array.isArray(items)) {
                            console.log('Items sent to special client:', items);
                            // Convert array to string with format: name@price@quantity##name@price@quantity
                            const formattedString = items
                                .map(item => `${item.name}@${item.price}@${item.quantity}`)
                                .join('##');
                            specialClient.send(formattedString);
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
