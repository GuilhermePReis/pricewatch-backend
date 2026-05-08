// PriceWatch — routes/alerts.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Todas as rotas exigem autenticação
router.use(requireAuth);

// ─── GET /api/alerts — lista alertas do usuário ───────────
router.get('/', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.userId },
    include: { asset: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(alerts);
});

// ─── POST /api/alerts — cria alerta ──────────────────────
router.post('/', [
  body('ticker').trim().notEmpty(),
  body('targetPrice').isFloat({ min: 0.000001 }),
  body('direction').isIn(['ABOVE', 'BELOW']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { ticker, targetPrice, direction } = req.body;

  try {
    // Busca ou cria o ativo
    let asset = await prisma.asset.findUnique({ where: { ticker } });
    if (!asset) {
      // Busca metadados na API financeira
      const yf = require('yahoo-finance2').default;
      const quote = await yf.quote(ticker);
      asset = await prisma.asset.create({
        data: {
          ticker,
          name: quote.longName || quote.shortName || ticker,
          exchange: quote.exchange || 'N/A',
          type: ticker.includes('=X') ? 'CURRENCY' : 'STOCK',
          currency: quote.currency || 'BRL',
        },
      });
    }

    const alert = await prisma.alert.create({
      data: {
        userId: req.userId,
        assetId: asset.id,
        targetPrice,
        direction,
      },
      include: { asset: true },
    });

    res.status(201).json(alert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar alerta' });
  }
});

// ─── PATCH /api/alerts/:id — ativa/desativa ───────────────
router.patch('/:id', async (req, res) => {
  const { active } = req.body;
  const alert = await prisma.alert.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });

  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: { active: Boolean(active) },
  });
  res.json(updated);
});

// ─── DELETE /api/alerts/:id — remove alerta ───────────────
router.delete('/:id', async (req, res) => {
  const alert = await prisma.alert.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado' });

  await prisma.alert.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
