const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { getDb } = require('../database/init');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { generateRandomPassword } = require('../utils/helpers');
const mailer = require('../services/mailer');

const router = express.Router();
router.use(authenticate);
router.use(authorize('superadmin', 'admin'));

const userSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  affiliation: z.string().optional(),
  role: z.enum(['superadmin', 'admin', 'reviewer', 'author']),
  password: z.string().min(8).optional(),
  is_active: z.boolean().optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  affiliation: z.string().optional(),
  conference_id: z.number().int(),
  role: z.enum(['chair', 'reviewer']).default('reviewer'),
  track_ids: z.array(z.number().int()).optional(),
});

router.get('/', (req, res) => {
  const db = getDb();
  const { conference_id, role, search } = req.query;

  let query = 'SELECT id, email, full_name, affiliation, role, is_active, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (search) {
    query += ' AND (full_name LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  let users = db.prepare(query).all(...params);

  if (conference_id) {
    const confId = parseInt(conference_id, 10);
    const memberIds = db.prepare(
      'SELECT user_id, role as conf_role, tracks FROM conference_members WHERE conference_id = ?'
    ).all(confId);

    const memberMap = new Map(memberIds.map(m => [m.user_id, m]));
    users = users.map(u => ({
      ...u,
      conference_role: memberMap.get(u.id)?.conf_role || null,
      conference_tracks: memberMap.get(u.id)?.tracks || null,
    }));
  }

  res.json(users);
});

router.post('/', validate(userSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const data = req.validated;

    if (data.role === 'superadmin' && req.user.role !== 'superadmin') {
      throw new ValidationError('Solo superadmin puede crear superadmins');
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existing) throw new ValidationError('El email ya está registrado');

    const password = data.password || generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, full_name, affiliation, role, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(data.email, passwordHash, data.full_name, data.affiliation || null, data.role, data.is_active !== false ? 1 : 0);

    res.status(201).json({
      id: result.lastInsertRowid,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      temporary_password: data.password ? undefined : password,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(userSchema.partial()), async (req, res, next) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const { email, full_name, affiliation, role, password, is_active } = req.validated;

    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      throw new ValidationError('Solo superadmin puede asignar rol superadmin');
    }

    let passwordHash = user.password_hash;
    if (password) {
      if (password.length < 8) throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
      passwordHash = await bcrypt.hash(password, 12);
    }

    db.prepare(`
      UPDATE users SET email=COALESCE(?,email), password_hash=?, full_name=COALESCE(?,full_name),
        affiliation=COALESCE(?,affiliation), role=COALESCE(?,role), is_active=COALESCE(?,is_active)
      WHERE id=?
    `).run(email || null, passwordHash, full_name || null, affiliation, role || null, is_active != null ? (is_active ? 1 : 0) : null, userId);

    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    next(err);
  }
});

router.post('/invite', validate(inviteSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const data = req.validated;

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    let tempPassword = null;

    if (!user) {
      tempPassword = generateRandomPassword();
      const hash = await bcrypt.hash(tempPassword, 10);
      const result = db.prepare(
        'INSERT INTO users (email, password_hash, full_name, affiliation, role) VALUES (?, ?, ?, ?, ?)'
      ).run(data.email, hash, data.full_name, data.affiliation || null, 'reviewer');
      user = { id: result.lastInsertRowid, email: data.email, full_name: data.full_name };
    }

    db.prepare(`
      INSERT OR REPLACE INTO conference_members (conference_id, user_id, role, tracks)
      VALUES (?, ?, ?, ?)
    `).run(data.conference_id, user.id, data.role, data.track_ids ? JSON.stringify(data.track_ids) : null);

    const conference = db.prepare('SELECT name FROM conferences WHERE id = ?').get(data.conference_id);

    res.status(201).json({
      user_id: user.id,
      message: `${data.full_name} invitado como ${data.role}`,
      temporary_password: tempPassword,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
