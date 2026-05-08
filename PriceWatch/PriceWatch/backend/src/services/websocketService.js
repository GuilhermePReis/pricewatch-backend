// PriceWatch — services/websocketService.js
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url   = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(1008, 'Token inválido');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('close', () => {});

    ws.send(JSON.stringify({ type: 'connected', message: 'PriceWatch WS pronto' }));
  });

  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  console.log('🔌 WebSocket iniciado em /ws');
}

module.exports = { initWebSocket };