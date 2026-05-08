// PriceWatch — src/routes/users.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth }  = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, fullName: true, age: true, gender: true,
        nationality: true, city: true, email: true,
        emailVerified: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

router.patch('/me', async (req, res) => {
  const allowed = ['fullName', 'age', 'gender', 'nationality', 'city'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  try {
    const user = await prisma.user.update({
      where: { id: req.userId }, data,
      select: { id: true, fullName: true, email: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.delete('/me', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

module.exports = router;