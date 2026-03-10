const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { getDb } = require('./database/init');
const { runSeeds } = require('./database/seeds');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const conferencesRoutes = require('./routes/conferences.routes');
const { publicRouter: submissionsPublicRouter, dashboardRouter: submissionsDashboardRouter } = require('./routes/submissions.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const usersRoutes = require('./routes/users.routes');
const { authenticate, authorize } = require('./middleware/auth');
const { getStats } = require('./services/stats');
const { autoAssign } = require('./services/assignment');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const app = express();

app.use(cors({
  origin: config.app.allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/uploads/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(config.app.uploadDir, filename);
  const uploadDir = path.resolve(config.app.uploadDir);
  if (!filePath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  res.sendFile(filePath);
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/submissions', submissionsPublicRouter);

// Dashboard routes
app.use('/api/dashboard/conferences', conferencesRoutes);
app.use('/api/dashboard/submissions', submissionsDashboardRouter);
app.use('/api/dashboard/reviews', reviewsRoutes);
app.use('/api/dashboard/users', usersRoutes);

// Stats
app.get('/api/dashboard/stats', authenticate, asyncHandler((req, res) => {
  const conferenceId = req.query.conference_id ? parseInt(req.query.conference_id, 10) : null;
  const stats = getStats(conferenceId);
  res.json(stats);
}));

// Auto-assign
app.post('/api/dashboard/auto-assign', authenticate, authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const { conference_id } = req.body;
  if (!conference_id) return res.status(400).json({ error: 'conference_id requerido' });
  const result = autoAssign(conference_id);
  res.json(result);
}));

// Email log
app.get('/api/dashboard/email-log', authenticate, authorize('superadmin', 'admin'), asyncHandler((req, res) => {
  const db = getDb();
  const { conference_id, template, status, page = '1' } = req.query;
  const pageNum = parseInt(page, 10);
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  let query = 'SELECT * FROM email_log WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM email_log WHERE 1=1';
  const params = [];
  const countParams = [];

  if (conference_id) {
    query += ' AND conference_id = ?';
    countQuery += ' AND conference_id = ?';
    params.push(parseInt(conference_id, 10));
    countParams.push(parseInt(conference_id, 10));
  }
  if (template) {
    query += ' AND template = ?';
    countQuery += ' AND template = ?';
    params.push(template);
    countParams.push(template);
  }
  if (status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  const { total } = db.prepare(countQuery).get(...countParams);
  query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = db.prepare(query).all(...params);
  res.json({ logs, pagination: { page: pageNum, limit, total, pages: Math.ceil(total / limit) } });
}));

// Settings
app.get('/api/dashboard/settings', authenticate, authorize('superadmin'), asyncHandler((req, res) => {
  const db = getDb();
  const settings = db.prepare('SELECT * FROM settings').all();
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });
  res.json(settingsMap);
}));

app.put('/api/dashboard/settings', authenticate, authorize('superadmin'), asyncHandler((req, res) => {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const entries = Object.entries(req.body);
  const tx = db.transaction(() => {
    for (const [key, value] of entries) {
      upsert.run(key, String(value));
    }
  });
  tx();
  res.json({ message: 'Configuración actualizada' });
}));

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  if (!err.isOperational) {
    console.error('Unhandled error:', err);
  }

  res.status(status).json({
    error: message,
    ...(err.errors && { errors: err.errors }),
  });
});

async function start() {
  getDb();
  await runSeeds();

  app.listen(config.port, () => {
    console.log(`OpenPapers backend running on port ${config.port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
