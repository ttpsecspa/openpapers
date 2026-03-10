const express = require('express');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { getDb } = require('../database/init');
const config = require('../config');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const { generateTrackingCode } = require('../utils/helpers');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');
const mailer = require('../services/mailer');

// CWE-400: limpiar archivo subido si la validación falla
function cleanupUploadedFile(req) {
  if (req.file) {
    const filePath = path.resolve(config.app.uploadDir, req.file.filename);
    fs.unlink(filePath, () => {}); // fire-and-forget
  }
}

const router = express.Router();

// Public submission endpoint
const submissionSchema = z.object({
  conference_id: z.number().int(),
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  authors_json: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }, 'authors_json debe ser un array JSON válido'),
  abstract: z.string().min(50, 'El abstract debe tener al menos 50 caracteres'),
  keywords: z.string().optional(),
  track_id: z.number().int().optional(),
  submitted_by_email: z.string().email(),
});

router.post('/', upload.single('file'), (req, res, next) => {
  try {
    const parsed = submissionSchema.safeParse({
      ...req.body,
      conference_id: parseInt(req.body.conference_id, 10),
      track_id: req.body.track_id ? parseInt(req.body.track_id, 10) : undefined,
    });

    if (!parsed.success) {
      cleanupUploadedFile(req);
      const errors = parsed.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
      throw new ValidationError('Datos inválidos', errors);
    }

    const data = parsed.data;
    const db = getDb();

    const conference = db.prepare('SELECT * FROM conferences WHERE id = ? AND is_active = 1').get(data.conference_id);
    if (!conference) {
      cleanupUploadedFile(req);
      throw new NotFoundError('Conferencia no encontrada o cerrada');
    }

    const now = new Date().toISOString().split('T')[0];
    if (now > conference.submission_deadline) {
      cleanupUploadedFile(req);
      throw new ValidationError('El plazo de envío ha finalizado');
    }

    const year = conference.edition || new Date().getFullYear().toString();

    const { trackingCode, result } = db.transaction(() => {
      const trackingCode = generateTrackingCode(db, conference.slug, year);

      const result = db.prepare(`
        INSERT INTO submissions (conference_id, tracking_code, title, authors_json, abstract, keywords,
          track_id, file_path, file_original_name, submitted_by_email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
      `).run(
        data.conference_id, trackingCode, data.title, data.authors_json, data.abstract,
        data.keywords || null, data.track_id || null,
        req.file ? req.file.filename : null,
        req.file ? req.file.originalname : null,
        data.submitted_by_email
      );

      return { trackingCode, result };
    })();

    mailer.sendSubmissionConfirmation(data.submitted_by_email, {
      trackingCode,
      title: data.title,
      conferenceName: conference.name,
    }, conference.id).catch(err => console.error('Email error:', err));

    res.status(201).json({
      id: result.lastInsertRowid,
      tracking_code: trackingCode,
      message: 'Paper enviado exitosamente',
    });
  } catch (err) {
    next(err);
  }
});

// Dashboard endpoints (authenticated)
const dashboardRouter = express.Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const { conference_id, status, track_id, search, page = '1' } = req.query;
    const pageNum = parseInt(page, 10);
    const limit = 20;
    const offset = (pageNum - 1) * limit;

    let query = '';
    let countQuery = '';
    const params = [];
    const countParams = [];

    if (req.user.role === 'reviewer') {
      query = `
        SELECT s.*, c.name as conference_name, c.is_double_blind, t.name as track_name
        FROM submissions s
        JOIN conferences c ON c.id = s.conference_id
        LEFT JOIN tracks t ON t.id = s.track_id
        JOIN review_assignments ra ON ra.submission_id = s.id
        WHERE ra.reviewer_id = ?
      `;
      countQuery = `
        SELECT COUNT(*) as total FROM submissions s
        JOIN review_assignments ra ON ra.submission_id = s.id
        WHERE ra.reviewer_id = ?
      `;
      params.push(req.user.id);
      countParams.push(req.user.id);
    } else if (req.user.role === 'admin') {
      // Admin solo ve submissions de conferencias donde es chair (CWE-863)
      query = `
        SELECT s.*, c.name as conference_name, t.name as track_name
        FROM submissions s
        JOIN conferences c ON c.id = s.conference_id
        LEFT JOIN tracks t ON t.id = s.track_id
        JOIN conference_members cm ON cm.conference_id = s.conference_id
        WHERE cm.user_id = ? AND cm.role = 'chair'
      `;
      countQuery = `
        SELECT COUNT(*) as total FROM submissions s
        JOIN conference_members cm ON cm.conference_id = s.conference_id
        WHERE cm.user_id = ? AND cm.role = 'chair'
      `;
      params.push(req.user.id);
      countParams.push(req.user.id);
    } else {
      // superadmin ve todo
      query = `
        SELECT s.*, c.name as conference_name, t.name as track_name
        FROM submissions s
        JOIN conferences c ON c.id = s.conference_id
        LEFT JOIN tracks t ON t.id = s.track_id
        WHERE 1=1
      `;
      countQuery = 'SELECT COUNT(*) as total FROM submissions s WHERE 1=1';
    }

    if (conference_id) {
      query += ' AND s.conference_id = ?';
      countQuery += ' AND s.conference_id = ?';
      params.push(parseInt(conference_id, 10));
      countParams.push(parseInt(conference_id, 10));
    }

    if (status) {
      query += ' AND s.status = ?';
      countQuery += ' AND s.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (track_id) {
      query += ' AND s.track_id = ?';
      countQuery += ' AND s.track_id = ?';
      params.push(parseInt(track_id, 10));
      countParams.push(parseInt(track_id, 10));
    }

    if (search) {
      query += ' AND (s.title LIKE ? OR s.tracking_code LIKE ?)';
      countQuery += ' AND (s.title LIKE ? OR s.tracking_code LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    query += ' ORDER BY s.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    let submissions = db.prepare(query).all(...params);

    if (req.user.role === 'reviewer') {
      submissions = submissions.map(s => {
        if (s.is_double_blind) {
          const { authors_json, submitted_by_email, ...safe } = s;
          return safe;
        }
        return s;
      });
    }

    res.json({
      submissions,
      pagination: { page: pageNum, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('ID inválido');

    const submission = db.prepare(`
      SELECT s.*, c.name as conference_name, c.is_double_blind, t.name as track_name
      FROM submissions s
      JOIN conferences c ON c.id = s.conference_id
      LEFT JOIN tracks t ON t.id = s.track_id
      WHERE s.id = ?
    `).get(id);

    if (!submission) throw new NotFoundError('Envío no encontrado');

    // CWE-863: verificar acceso por rol
    if (req.user.role === 'reviewer') {
      const assigned = db.prepare(
        'SELECT id FROM review_assignments WHERE submission_id = ? AND reviewer_id = ?'
      ).get(id, req.user.id);
      if (!assigned) throw new ForbiddenError();
    } else if (req.user.role === 'admin') {
      const isChair = db.prepare(
        "SELECT id FROM conference_members WHERE conference_id = ? AND user_id = ? AND role = 'chair'"
      ).get(submission.conference_id, req.user.id);
      if (!isChair) throw new ForbiddenError('No tienes acceso a esta conferencia');
    }

    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.submission_id = ?
    `).all(id);

    const assignments = db.prepare(`
      SELECT ra.*, u.full_name as reviewer_name, u.email as reviewer_email
      FROM review_assignments ra
      JOIN users u ON u.id = ra.reviewer_id
      WHERE ra.submission_id = ?
    `).all(id);

    let result = { ...submission, reviews, assignments };

    if (req.user.role === 'reviewer' && submission.is_double_blind) {
      delete result.authors_json;
      delete result.submitted_by_email;
      result.reviews = reviews.map(r => {
        if (r.reviewer_id !== req.user.id) {
          const { comments_to_chairs, reviewer_name, ...safe } = r;
          return safe;
        }
        return r;
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.patch('/:id/status', authorize('superadmin', 'admin'), (req, res, next) => {
  try {
    const db = getDb();
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('ID inválido');
    const { status, decision_notes } = req.body;

    const validStatuses = ['submitted', 'under_review', 'accepted', 'rejected', 'revision_requested', 'withdrawn', 'camera_ready'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Estado inválido');
    }

    const submission = db.prepare(`
      SELECT s.*, c.name as conference_name, c.camera_ready_date
      FROM submissions s JOIN conferences c ON c.id = s.conference_id
      WHERE s.id = ?
    `).get(id);
    if (!submission) throw new NotFoundError();

    // CWE-863: admin solo puede cambiar status de sus conferencias
    if (req.user.role === 'admin') {
      const isChair = db.prepare(
        "SELECT id FROM conference_members WHERE conference_id = ? AND user_id = ? AND role = 'chair'"
      ).get(submission.conference_id, req.user.id);
      if (!isChair) throw new ForbiddenError('No tienes acceso a esta conferencia');
    }

    db.prepare(
      'UPDATE submissions SET status = ?, decision_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, decision_notes || null, id);

    const reviews = db.prepare(
      'SELECT overall_score, comments_to_authors, recommendation FROM reviews WHERE submission_id = ?'
    ).all(id);

    const avgScore = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length).toFixed(1)
      : null;

    if (status === 'accepted') {
      mailer.sendDecisionAccepted(submission.submitted_by_email, {
        trackingCode: submission.tracking_code,
        title: submission.title,
        conferenceName: submission.conference_name,
        avgScore,
        reviews,
        cameraReadyDate: submission.camera_ready_date,
      }, submission.conference_id).catch(err => console.error('Email error:', err));
    } else if (status === 'rejected') {
      mailer.sendDecisionRejected(submission.submitted_by_email, {
        trackingCode: submission.tracking_code,
        title: submission.title,
        conferenceName: submission.conference_name,
        reviews,
      }, submission.conference_id).catch(err => console.error('Email error:', err));
    } else if (status === 'revision_requested') {
      mailer.sendDecisionRevision(submission.submitted_by_email, {
        trackingCode: submission.tracking_code,
        title: submission.title,
        conferenceName: submission.conference_name,
        reviews,
        decision_notes,
      }, submission.conference_id).catch(err => console.error('Email error:', err));
    }

    res.json({ message: 'Estado actualizado', status });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.patch('/:id/assign', authorize('superadmin', 'admin'), (req, res, next) => {
  try {
    const db = getDb();
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) throw new ValidationError('ID inválido');
    const { reviewer_ids, deadline } = req.body;

    if (!Array.isArray(reviewer_ids) || reviewer_ids.length === 0) {
      throw new ValidationError('Debe seleccionar al menos un revisor');
    }

    const submission = db.prepare(`
      SELECT s.*, c.name as conference_name, c.is_double_blind
      FROM submissions s JOIN conferences c ON c.id = s.conference_id
      WHERE s.id = ?
    `).get(submissionId);
    if (!submission) throw new NotFoundError();

    // CWE-863: admin solo puede asignar revisores en sus conferencias
    if (req.user.role === 'admin') {
      const isChair = db.prepare(
        "SELECT id FROM conference_members WHERE conference_id = ? AND user_id = ? AND role = 'chair'"
      ).get(submission.conference_id, req.user.id);
      if (!isChair) throw new ForbiddenError('No tienes acceso a esta conferencia');
    }

    const authors = JSON.parse(submission.authors_json || '[]');
    const authorEmails = authors.map(a => a.email?.toLowerCase()).filter(Boolean);

    const insertAssignment = db.prepare(`
      INSERT OR IGNORE INTO review_assignments (submission_id, reviewer_id, deadline, status)
      VALUES (?, ?, ?, 'pending')
    `);

    const assigned = [];
    const conflicts = [];

    for (const reviewerId of reviewer_ids) {
      const reviewer = db.prepare('SELECT * FROM users WHERE id = ?').get(reviewerId);
      if (!reviewer) continue;

      if (authorEmails.includes(reviewer.email.toLowerCase())) {
        conflicts.push(reviewer.full_name);
        continue;
      }

      const result = insertAssignment.run(submissionId, reviewerId, deadline || null);
      if (result.changes > 0) {
        assigned.push(reviewer.full_name);

        mailer.sendReviewAssignment(reviewer.email, {
          title: submission.is_double_blind ? '[Doble ciego]' : submission.title,
          conferenceName: submission.conference_name,
          deadline,
        }, submission.conference_id).catch(err => console.error('Email error:', err));
      }
    }

    if (submission.status === 'submitted') {
      db.prepare("UPDATE submissions SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(submissionId);
    }

    res.json({ assigned, conflicts, message: `${assigned.length} revisores asignados` });
  } catch (err) {
    next(err);
  }
});

module.exports = { publicRouter: router, dashboardRouter };
