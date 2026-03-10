const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { getDb } = require('../database/init');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { UnauthorizedError, ValidationError } = require('../utils/errors');

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  full_name: z.string().min(2, 'Nombre requerido').max(200),
  affiliation: z.string().max(300).optional(),
});

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role, full_name: user.full_name };
  const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiry });
  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });
  return { accessToken, refreshToken };
}

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const tokens = generateTokens(user);
    res.json({
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, affiliation: user.affiliation },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, full_name, affiliation } = req.validated;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new ValidationError('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, full_name, affiliation, role) VALUES (?, ?, ?, ?, ?)'
    ).run(email, passwordHash, full_name, affiliation || null, 'author');

    const user = { id: result.lastInsertRowid, email, role: 'author', full_name };
    const tokens = generateTokens(user);
    res.status(201).json({ user, ...tokens });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token requerido');
    }

    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.id);

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Refresh token inválido'));
    }
    next(err);
  }
});

module.exports = router;
