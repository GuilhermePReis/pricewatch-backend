// PriceWatch — routes/assets.js + routes/prices.js (combinado)
// Separar em arquivos distintos em produção

const express = require('express');
const axios = require('axios');

async function getQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const meta = data.chart.result[0].meta;
  return {
    symbol:                    meta.symbol,
    longName:                  meta.longName || ticker,
    shortName:                 meta.shortName || ticker,
    regularMarketPrice:        meta.regularMarketPrice,
    regularMarketChange:       meta.regularMarketPrice - meta.chartPreviousClose,
    regularMarketChangePercent:((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
    regularMarketDayHigh:      meta.regularMarketDayHigh,
    regularMarketDayLow:       meta.regularMarketDayLow,
    regularMarketVolume:       meta.regularMarketVolume,
    exchange:                  meta.exchangeName,
    currency:                  meta.currency,
    marketState:               meta.marketState,
  };
}

async function searchTicker(query) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10`;
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return data.quotes || [];
}
const Redis   = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Bolsas suportadas e sufixos Yahoo Finance
const EXCHANGES = {
  'B3':      '.SA',
  'NASDAQ':  '',
  'NYSE':    '',
  'TSX':     '.TO',
  'BMV':     '.MX',
  'BVL':     '.LM',
  'BCS':     '.SN',
  'BVRD':    '',
  'BYMA':    '.BA',
  'FOREX':   '=X',
};

// ─── GET /api/assets/search?q=PETR&exchange=B3 ───────────
router.get('/search', requireAuth, async (req, res) => {
  const { q, exchange } = req.query;
  if (!q || q.length < 1) return res.json([]);

  try {
    // Busca no Yahoo Finance
    const results = await searchTicker(q);
    const filtered = results
      .filter(r => r.symbol && r.quoteType !== 'OPTION')
      .filter(r => !exchange || exchange === 'Todos' || r.exchange === exchange)
      .slice(0, 8)
      .map(r => ({
        ticker:   r.symbol,
        name:     r.longname || r.shortname || r.symbol,
        exchange: r.exchange || 'N/A',
        type:     r.quoteType === 'CURRENCY' ? 'CURRENCY' : 'STOCK',
      }));

    res.json(filtered);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar ativos' });
  }
});

// ─── GET /api/assets/quote/:ticker — preço atual ─────────
router.get('/quote/:ticker', requireAuth, async (req, res) => {
  const { ticker } = req.params;

  // Verifica cache Redis primeiro
  const cacheKey = `quote:${ticker}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  try {
    const q = await getQuote(ticker);
    const data = {
      ticker:       q.symbol,
      name:         q.longName || q.shortName || ticker,
      price:        q.regularMarketPrice,
      change:       q.regularMarketChange,
      changePct:    q.regularMarketChangePercent,
      dayHigh:      q.regularMarketDayHigh,
      dayLow:       q.regularMarketDayLow,
      volume:       q.regularMarketVolume,
      exchange:     q.exchange,
      currency:     q.currency,
      marketState:  q.marketState,
    };

    // Cache por 30s
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 30);
    res.json(data);
  } catch {
    res.status(404).json({ error: 'Ativo não encontrado' });
  }
});

// ─── GET /api/assets/history/:ticker?period=1mo ──────────
router.get('/history/:ticker', requireAuth, async (req, res) => {
  const { ticker } = req.params;
  const period = req.query.period || '1mo'; // 1d|5d|1mo|3mo|6mo|1y|5y

  try {
    const interval = period === '1d' ? '5m' : '1d';
    const range = period;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const { data: raw } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const result = raw.chart.result[0];
    const timestamps = result.timestamp || [];
    const closes = result.indicators.quote[0].close || [];
    const data = timestamps.map((t, i) => ({
      date:   new Date(t * 1000),
      close:  closes[i],
      open:   result.indicators.quote[0].open?.[i],
      high:   result.indicators.quote[0].high?.[i],
      low:    result.indicators.quote[0].low?.[i],
      volume: result.indicators.quote[0].volume?.[i],
    }));

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// ─── GET /api/assets/favorites — lista favoritos ─────────
router.get('/favorites', requireAuth, async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.userId },
    include: { asset: true },
  });
  res.json(favs.map(f => f.asset));
});

// ─── POST /api/assets/favorites/:ticker ──────────────────
router.post('/favorites/:ticker', requireAuth, async (req, res) => {
  const { ticker } = req.params;
  let asset = await prisma.asset.findUnique({ where: { ticker } });
  if (!asset) return res.status(404).json({ error: 'Ativo não encontrado' });

  await prisma.favorite.upsert({
    where:  { userId_assetId: { userId: req.userId, assetId: asset.id } },
    create: { userId: req.userId, assetId: asset.id },
    update: {},
  });

  res.json({ success: true });
});

// ─── DELETE /api/assets/favorites/:ticker ────────────────
router.delete('/favorites/:ticker', requireAuth, async (req, res) => {
  const { ticker } = req.params;
  const asset = await prisma.asset.findUnique({ where: { ticker } });
  if (!asset) return res.status(404).json({ error: 'Ativo não encontrado' });

  await prisma.favorite.deleteMany({
    where: { userId: req.userId, assetId: asset.id },
  });

  res.json({ success: true });
});

// ─── Helper: converte período em data ────────────────────
function periodToDate(period) {
  const map = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '5y': 1825 };
  const days = map[period] || 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

module.exports = router;
