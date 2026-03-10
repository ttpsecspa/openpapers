const express = require('express');
const rateLimit = require('express-rate-limit');
const { getDb } = require('../database/init');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();

// Rate limiter estricto para tracking code (CWE-200: anti-enumeración)
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de consulta, intenta en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/conferences', (req, res, next) => {
  try {
    const db = getDb();
    const conferences = db.prepare(`
      SELECT c.*, COUNT(t.id) as track_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.conference_id = c.id) as submission_count
      FROM conferences c
      LEFT JOIN tracks t ON t.conference_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.submission_deadline ASC
    `).all();

    res.json(conferences);
  } catch (err) {
    next(err);
  }
});

router.get('/conferences/:slug', (req, res, next) => {
  try {
    const db = getDb();
    const conference = db.prepare('SELECT * FROM conferences WHERE slug = ?').get(req.params.slug);

    if (!conference) {
      throw new NotFoundError('Conferencia no encontrada');
    }

    const tracks = db.prepare(
      'SELECT * FROM tracks WHERE conference_id = ? ORDER BY sort_order'
    ).all(conference.id);

    res.json({ ...conference, tracks });
  } catch (err) {
    next(err);
  }
});

router.get('/submissions/track/:code', trackingLimiter, (req, res, next) => {
  try {
    const db = getDb();
    const submission = db.prepare(`
      SELECT s.tracking_code, s.title, s.status, s.submitted_at, s.updated_at,
             c.name as conference_name, t.name as track_name
      FROM submissions s
      JOIN conferences c ON c.id = s.conference_id
      LEFT JOIN tracks t ON t.id = s.track_id
      WHERE s.tracking_code = ?
    `).get(req.params.code);

    if (!submission) {
      throw new NotFoundError('Envío no encontrado. Verifica tu código de seguimiento.');
    }

    const reviews = db.prepare(`
      SELECT r.overall_score, r.comments_to_authors, r.recommendation, r.submitted_at
      FROM reviews r
      WHERE r.submission_id = (SELECT id FROM submissions WHERE tracking_code = ?)
    `).all(req.params.code);

    const safeReviews = (submission.status === 'accepted' || submission.status === 'rejected' || submission.status === 'revision_requested')
      ? reviews.map(r => ({
          overall_score: r.overall_score,
          comments_to_authors: r.comments_to_authors,
          recommendation: r.recommendation,
        }))
      : [];

    res.json({ ...submission, reviews: safeReviews });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
