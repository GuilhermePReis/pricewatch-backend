// PriceWatch — server.js
require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');

const authRoutes   = require('./routes/auth');
const assetRoutes  = require('./routes/assets');
const alertRoutes  = require('./routes/alerts');
const userRoutes   = require('./routes/users');
const priceRoutes  = require('./routes/prices');

const { initWebSocket } = require('./services/websocketService');
const { startAlertWorker } = require('./workers/alertWorker');

const app = express();
const httpServer = createServer(app);

// ─── Segurança ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' })); // restringir em produção
app.use(express.json());

// Rate limiting global: 100 req / 15 min por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Rotas ────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/prices', priceRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'PriceWatch' }));

// ─── Erro global ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

// ─── WebSocket (preços em tempo real) ────────────────────
initWebSocket(httpServer);

// ─── Worker de alertas ────────────────────────────────────
startAlertWorker();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 PriceWatch API rodando na porta ${PORT}`);
});
