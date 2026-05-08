// PriceWatch — workers/alertWorker.js
const cron   = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const admin  = require('firebase-admin');
const Redis  = require('ioredis');
const axios  = require('axios');

const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL);

// ─── Busca preços via Yahoo Finance direto ────────────────
async function getQuotes(tickers) {
  const result = {};
  await Promise.all(tickers.map(async (ticker) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const price = data.chart.result[0].meta.regularMarketPrice;
      result[ticker] = price;
    } catch {}
  }));
  return result;
}

// ─── Inicializa Firebase ──────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// ─── Inicia o worker ──────────────────────────────────────
function startAlertWorker() {
  console.log('🔔 PriceWatch Alert Worker iniciado');
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await checkAlerts();
    } catch (err) {
      console.error('[AlertWorker] Erro:', err.message);
    }
  });
}

// ─── Verifica todos os alertas ativos ────────────────────
async function checkAlerts() {
  const alerts = await prisma.alert.findMany({
    where: { active: true, triggeredAt: null },
    include: {
      asset: true,
      user: { select: { fcmToken: true, fullName: true } },
    },
  });

  if (alerts.length === 0) return;

  const tickers = [...new Set(alerts.map(a => a.asset.ticker))];
  const prices  = await fetchPricesWithCache(tickers);

  for (const alert of alerts) {
    const price = prices[alert.asset.ticker];
    if (price == null) continue;

    const target    = parseFloat(alert.targetPrice);
    const triggered = alert.direction === 'ABOVE'
      ? price >= target
      : price <= target;

    if (triggered) await triggerAlert(alert, price);
  }
}

// ─── Dispara alerta ───────────────────────────────────────
async function triggerAlert(alert, currentPrice) {
  await prisma.alert.update({
    where: { id: alert.id },
    data:  { triggeredAt: new Date(), active: false },
  });

  console.log(`[AlertWorker] ✅ ${alert.asset.ticker} disparou (atual: ${currentPrice})`);

  if (!alert.user.fcmToken) return;

  const dirLabel = alert.direction === 'ABOVE' ? 'subiu acima de' : 'caiu abaixo de';
  const body = `${alert.asset.ticker} ${dirLabel} ${formatPrice(alert.targetPrice, alert.asset.currency)}. Atual: ${formatPrice(currentPrice, alert.asset.currency)}`;

  try {
    await admin.messaging().send({
      token: alert.user.fcmToken,
      notification: {
        title: `📈 Alerta PriceWatch — ${alert.asset.ticker}`,
        body,
      },
      data: {
        alertId: alert.id,
        ticker:  alert.asset.ticker,
        price:   String(currentPrice),
        screen:  'AssetDetail',
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  } catch (err) {
    console.error('[AlertWorker] Erro FCM:', err.message);
  }
}

// ─── Busca preços com cache Redis ─────────────────────────
async function fetchPricesWithCache(tickers) {
  const result  = {};
  const toFetch = [];

  for (const ticker of tickers) {
    try {
      const cached = await redis.get(`price:${ticker}`);
      if (cached) { result[ticker] = parseFloat(cached); continue; }
    } catch {}
    toFetch.push(ticker);
  }

  if (toFetch.length > 0) {
    const prices = await getQuotes(toFetch);
    for (const [symbol, price] of Object.entries(prices)) {
      result[symbol] = price;
      redis.set(`price:${symbol}`, price, 'EX', 25).catch(() => {});
      persistPriceHistory(symbol, price, null);
    }
  }

  return result;
}

// ─── Salva histórico ──────────────────────────────────────
async function persistPriceHistory(ticker, price, volume) {
  try {
    const asset = await prisma.asset.findUnique({ where: { ticker } });
    if (!asset) return;
    await prisma.priceHistory.create({
      data: { assetId: asset.id, price, volume: volume ?? null },
    });
  } catch {}
}

// ─── Formata preço ────────────────────────────────────────
function formatPrice(price, currency = 'BRL') {
  const val = parseFloat(price);
  if (currency === 'BRL') return `R$ ${val.toFixed(2)}`;
  if (currency === 'USD') return `USD ${val.toFixed(2)}`;
  return `${val.toFixed(2)} ${currency}`;
}

module.exports = { startAlertWorker };