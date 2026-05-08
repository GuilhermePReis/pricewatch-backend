// PriceWatch — workers/alertWorker.js
// Roda a cada 30s: verifica preços e dispara push se alerta atingido

const cron    = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const yf      = require('yahoo-finance2').default;
const admin   = require('firebase-admin');
const Redis   = require('ioredis');

const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL);

// Inicializa Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// ─── Inicia o worker ─────────────────────────────────────
function startAlertWorker() {
  console.log('🔔 PriceWatch Alert Worker iniciado');

  // Roda a cada 30 segundos
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
  // Carrega alertas ativos com dados do ativo e fcmToken do usuário
  const alerts = await prisma.alert.findMany({
    where: { active: true, triggeredAt: null },
    include: {
      asset: true,
      user: { select: { fcmToken: true, fullName: true } },
    },
  });

  if (alerts.length === 0) return;

  // Agrupa tickers únicos para fazer o mínimo de chamadas à API
  const tickers = [...new Set(alerts.map(a => a.asset.ticker))];

  // Busca preços atuais (com cache Redis de 25s para não sobrecarregar a API)
  const prices = await fetchPricesWithCache(tickers);

  // Processa cada alerta
  for (const alert of alerts) {
    const price = prices[alert.asset.ticker];
    if (price == null) continue;

    const target    = parseFloat(alert.targetPrice);
    const triggered = alert.direction === 'ABOVE'
      ? price >= target
      : price <= target;

    if (triggered) {
      await triggerAlert(alert, price);
    }
  }
}

// ─── Dispara alerta: salva no BD + envia push ─────────────
async function triggerAlert(alert, currentPrice) {
  // Marca como disparado
  await prisma.alert.update({
    where: { id: alert.id },
    data: { triggeredAt: new Date(), active: false },
  });

  console.log(
    `[AlertWorker] ✅ Alerta disparado: ${alert.asset.ticker} ` +
    `${alert.direction} ${alert.targetPrice} (atual: ${currentPrice})`
  );

  // Envia push notification se o usuário tiver token FCM
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
        alertId:  alert.id,
        ticker:   alert.asset.ticker,
        price:    String(currentPrice),
        screen:   'AssetDetail',
      },
      android: { priority: 'high' },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
  } catch (err) {
    console.error('[AlertWorker] Erro FCM:', err.message);
  }
}

// ─── Busca preços com cache Redis ─────────────────────────
async function fetchPricesWithCache(tickers) {
  const result = {};
  const toFetch = [];

  for (const ticker of tickers) {
    const cached = await redis.get(`price:${ticker}`);
    if (cached) {
      result[ticker] = parseFloat(cached);
    } else {
      toFetch.push(ticker);
    }
  }

  if (toFetch.length > 0) {
    // Yahoo Finance aceita array de tickers
    const quotes = await yf.quote(toFetch);
    const arr = Array.isArray(quotes) ? quotes : [quotes];

    for (const q of arr) {
      const price = q.regularMarketPrice;
      if (price != null) {
        result[q.symbol] = price;
        // Cache por 25s (ligeiramente menor que o intervalo do cron)
        await redis.set(`price:${q.symbol}`, price, 'EX', 25);

        // Persiste no histórico de preços
        persistPriceHistory(q.symbol, price, q.regularMarketVolume);
      }
    }
  }

  return result;
}

// ─── Salva histórico de preços (fire-and-forget) ──────────
async function persistPriceHistory(ticker, price, volume) {
  try {
    const asset = await prisma.asset.findUnique({ where: { ticker } });
    if (!asset) return;
    await prisma.priceHistory.create({
      data: { assetId: asset.id, price, volume: volume ?? null },
    });
  } catch {
    // Não interrompe o fluxo principal
  }
}

// ─── Formata preço com moeda ──────────────────────────────
function formatPrice(price, currency = 'BRL') {
  const val = parseFloat(price);
  if (currency === 'BRL') return `R$ ${val.toFixed(2)}`;
  if (currency === 'USD') return `USD ${val.toFixed(2)}`;
  return `${val.toFixed(2)} ${currency}`;
}

module.exports = { startAlertWorker };
