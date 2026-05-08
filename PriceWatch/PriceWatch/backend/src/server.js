// PriceWatch — server.js
require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const { createServer } = require('http');

const authRoutes   = require('./routes/auth');
const assetRoutes  = require('./routes/assets');
const alertRoutes  = require('./routes/alerts');
const userRoutes   = require('./routes/users');

const { initWebSocket }    = require('./services/websocketService');
const { startAlertWorker } = require('./workers/alertWorker');
const { initFirebase }     = require('./services/firebaseService');

const app        = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth',   authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users',  userRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'PriceWatch' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

initFirebase();
initWebSocket(httpServer);
startAlertWorker();

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PriceWatch API porta ${PORT}`);
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});