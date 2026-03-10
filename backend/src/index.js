const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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

// Security headers (CWE-16)
app.use(helmet({
  contentSecurityPolicy: false, // Manejado por Nginx en producción
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.app.allowedOrigins,
  credentials: true,
}));

// Body size limits (CWE-770)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting global (CWE-307)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,                  // 300 requests por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
}));

// Upload IDOR fix (CWE-862): verificar que el usuario tiene acceso al archivo
app.get('/uploads/:filename', authenticate, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(config.app.uploadDir, filename);
  const uploadDir = path.resolve(config.app.uploadDir);
  if (!filePath.startsWith(uploadDir)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // Verificar que el archivo pertenece a un paper al que el usuario tiene acceso
  const db = getDb();
  const submission = db.prepare('SELECT * FROM submissions WHERE file_path = ?').get(filename);
  if (!submission) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  if (req.user.role === 'reviewer') {
    const assigned = db.prepare(
      'SELECT id FROM review_assignments WHERE submission_id = ? AND reviewer_id = ?'
    ).get(submission.id, req.user.id);
    if (!assigned) {
      return res.status(403).json({ error: 'No tienes acceso a este archivo' });
    }
  }

  res.sendFile(filePath);
});

// Rate limiting estricto para auth (CWE-307)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos de autenticación, intenta en 15 minutos' },
});

// Public routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', publicRoutes);
app.use('/api/submissions', submissionsPublicRouter);

// Dashboard routes
app.use('/api/dashboard/conferences', conferencesRoutes);
app.use('/api/dashboard/submissions', submissionsDashboardRouter);
app.use('/api/dashboard/reviews', reviewsRoutes);
app.use('/api/dashboard/users', usersRoutes);

// Stats (CWE-862: requiere autorización)
app.get('/api/dashboard/stats', authenticate, authorize('superadmin', 'admin'), asyncHandler((req, res) => {
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

// Settings mass assignment fix (CWE-915): whitelist de claves permitidas
const ALLOWED_SETTINGS = new Set([
  'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
  'smtp_from_name', 'smtp_from_email',
  'app_name', 'app_url', 'max_file_size_mb',
]);

app.put('/api/dashboard/settings', authenticate, authorize('superadmin'), asyncHandler((req, res) => {
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const entries = Object.entries(req.body).filter(([key]) => ALLOWED_SETTINGS.has(key));

  if (entries.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron configuraciones válidas' });
  }

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
