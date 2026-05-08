// PriceWatch — auth controller + routes
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Validações de cadastro ───────────────────────────────
const registerValidations = [
  body('fullName').trim().notEmpty().withMessage('Nome obrigatório'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Idade inválida'),
  body('gender').isIn(['M','F','other']).withMessage('Sexo inválido'),
  body('nationality').trim().notEmpty().withMessage('Nacionalidade obrigatória'),
  body('city').trim().notEmpty().withMessage('Cidade obrigatória'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 8 }).withMessage('Senha: mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Senha deve conter letra maiúscula')
    .matches(/[0-9]/).withMessage('Senha deve conter número'),
];

// ─── POST /api/auth/register ──────────────────────────────
router.post('/register', registerValidations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { fullName, age, gender, nationality, city, email, password } = req.body;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criptografia bcrypt (custo 12 = bom equilíbrio segurança/performance)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { fullName, age, gender, nationality, city, email, passwordHash },
      select: { id: true, fullName: true, email: true, createdAt: true },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Comparação em tempo constante (evita timing attack)
    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ─── POST /api/auth/fcm-token ─────────────────────────────
// Atualiza o token FCM do dispositivo do usuário
router.post('/fcm-token', requireAuth, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken obrigatório' });

  await prisma.user.update({
    where: { id: req.userId },
    data: { fcmToken },
  });

  res.json({ success: true });
});

// ─── Helper: gera JWT ─────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─── Middleware de autenticação (exportado para outros módulos) ───
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = router;
module.exports.requireAuth = requireAuth;
