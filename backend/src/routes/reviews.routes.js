const express = require('express');
const { z } = require('zod');
const { getDb } = require('../database/init');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

const router = express.Router();
router.use(authenticate);

const reviewSchema = z.object({
  submission_id: z.number().int(),
  overall_score: z.number().int().min(1).max(10),
  originality_score: z.number().int().min(1).max(10).optional(),
  technical_score: z.number().int().min(1).max(10).optional(),
  clarity_score: z.number().int().min(1).max(10).optional(),
  relevance_score: z.number().int().min(1).max(10).optional(),
  recommendation: z.enum(['strong_accept', 'accept', 'weak_accept', 'weak_reject', 'reject', 'strong_reject']),
  comments_to_authors: z.string().min(10, 'Los comentarios deben tener al menos 10 caracteres'),
  comments_to_chairs: z.string().optional(),
  confidence: z.number().int().min(1).max(5).optional(),
});

router.get('/my', (req, res, next) => {
  try {
    const db = getDb();
    const assignments = db.prepare(`
      SELECT ra.*, s.title, s.tracking_code, s.status as submission_status,
             c.name as conference_name, c.is_double_blind, t.name as track_name,
             (SELECT COUNT(*) FROM reviews r WHERE r.submission_id = ra.submission_id AND r.reviewer_id = ra.reviewer_id) as has_review
      FROM review_assignments ra
      JOIN submissions s ON s.id = ra.submission_id
      JOIN conferences c ON c.id = s.conference_id
      LEFT JOIN tracks t ON t.id = s.track_id
      WHERE ra.reviewer_id = ?
      ORDER BY ra.status ASC, ra.deadline ASC
    `).all(req.user.id);

    res.json(assignments);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('superadmin', 'admin', 'reviewer'), validate(reviewSchema), (req, res, next) => {
  try {
    const db = getDb();
    const data = req.validated;

    const assignment = db.prepare(
      'SELECT * FROM review_assignments WHERE submission_id = ? AND reviewer_id = ?'
    ).get(data.submission_id, req.user.id);

    if (!assignment && req.user.role === 'reviewer') {
      throw new ForbiddenError('No tienes asignado este paper');
    }

    const existing = db.prepare(
      'SELECT id FROM reviews WHERE submission_id = ? AND reviewer_id = ?'
    ).get(data.submission_id, req.user.id);

    if (existing) {
      throw new ValidationError('Ya enviaste una revisión para este paper');
    }

    const result = db.prepare(`
      INSERT INTO reviews (submission_id, reviewer_id, overall_score, originality_score,
        technical_score, clarity_score, relevance_score, recommendation,
        comments_to_authors, comments_to_chairs, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.submission_id, req.user.id, data.overall_score,
      data.originality_score || null, data.technical_score || null,
      data.clarity_score || null, data.relevance_score || null,
      data.recommendation, data.comments_to_authors,
      data.comments_to_chairs || null, data.confidence || null
    );

    if (assignment) {
      db.prepare(
        "UPDATE review_assignments SET status = 'completed' WHERE submission_id = ? AND reviewer_id = ?"
      ).run(data.submission_id, req.user.id);
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Revisión enviada' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('superadmin', 'admin', 'reviewer'), (req, res, next) => {
  try {
    const db = getDb();
    const reviewId = parseInt(req.params.id, 10);
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

    if (!review) throw new NotFoundError('Revisión no encontrada');
    if (review.reviewer_id !== req.user.id && req.user.role === 'reviewer') {
      throw new ForbiddenError();
    }

    const parsed = reviewSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos inválidos');
    }

    const data = parsed.data;
    db.prepare(`
      UPDATE reviews SET
        overall_score = COALESCE(?, overall_score),
        originality_score = COALESCE(?, originality_score),
        technical_score = COALESCE(?, technical_score),
        clarity_score = COALESCE(?, clarity_score),
        relevance_score = COALESCE(?, relevance_score),
        recommendation = COALESCE(?, recommendation),
        comments_to_authors = COALESCE(?, comments_to_authors),
        comments_to_chairs = COALESCE(?, comments_to_chairs),
        confidence = COALESCE(?, confidence)
      WHERE id = ?
    `).run(
      data.overall_score, data.originality_score, data.technical_score,
      data.clarity_score, data.relevance_score, data.recommendation,
      data.comments_to_authors, data.comments_to_chairs, data.confidence,
      reviewId
    );

    res.json({ message: 'Revisión actualizada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
