const express = require('express');
const { z } = require('zod');
const { getDb } = require('../database/init');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

const router = express.Router();

const conferenceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  edition: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  submission_deadline: z.string().min(1),
  notification_date: z.string().optional(),
  camera_ready_date: z.string().optional(),
  is_active: z.boolean().optional(),
  is_double_blind: z.boolean().optional(),
  min_reviewers: z.number().int().min(1).max(10).optional(),
  max_file_size_mb: z.number().int().min(1).max(50).optional(),
  custom_fields: z.string().optional(),
  tracks: z.array(z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    sort_order: z.number().optional(),
  })).optional(),
});

router.use(authenticate);

router.get('/', authorize('superadmin', 'admin'), (req, res) => {
  const db = getDb();
  let conferences;

  if (req.user.role === 'superadmin') {
    conferences = db.prepare('SELECT * FROM conferences ORDER BY created_at DESC').all();
  } else {
    conferences = db.prepare(`
      SELECT c.* FROM conferences c
      JOIN conference_members cm ON cm.conference_id = c.id
      WHERE cm.user_id = ? AND cm.role = 'chair'
      ORDER BY c.created_at DESC
    `).all(req.user.id);
  }

  res.json(conferences);
});

router.post('/', authorize('superadmin'), validate(conferenceSchema), (req, res, next) => {
  try {
    const db = getDb();
    const data = req.validated;
    const tracks = data.tracks || [];
    delete data.tracks;

    const confId = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO conferences (name, slug, edition, description, logo_url, website_url, location,
          start_date, end_date, submission_deadline, notification_date, camera_ready_date,
          is_active, is_double_blind, min_reviewers, max_file_size_mb, custom_fields)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.name, data.slug, data.edition || null, data.description || null,
        data.logo_url || null, data.website_url || null, data.location || null,
        data.start_date || null, data.end_date || null, data.submission_deadline,
        data.notification_date || null, data.camera_ready_date || null,
        data.is_active !== false ? 1 : 0, data.is_double_blind !== false ? 1 : 0,
        data.min_reviewers || 2, data.max_file_size_mb || 10, data.custom_fields || null
      );

      const id = result.lastInsertRowid;

      const insertTrack = db.prepare(
        'INSERT INTO tracks (conference_id, name, description, sort_order) VALUES (?, ?, ?, ?)'
      );
      for (let i = 0; i < tracks.length; i++) {
        insertTrack.run(id, tracks[i].name, tracks[i].description || null, tracks[i].sort_order || i);
      }

      db.prepare(
        'INSERT INTO conference_members (conference_id, user_id, role) VALUES (?, ?, ?)'
      ).run(id, req.user.id, 'chair');

      return id;
    })();

    const conference = db.prepare('SELECT * FROM conferences WHERE id = ?').get(confId);
    const confTracks = db.prepare('SELECT * FROM tracks WHERE conference_id = ? ORDER BY sort_order').all(confId);

    res.status(201).json({ ...conference, tracks: confTracks });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('superadmin', 'admin'), validate(conferenceSchema), (req, res, next) => {
  try {
    const db = getDb();
    const confId = parseInt(req.params.id, 10);

    if (req.user.role === 'admin') {
      const member = db.prepare(
        "SELECT id FROM conference_members WHERE conference_id = ? AND user_id = ? AND role = 'chair'"
      ).get(confId, req.user.id);
      if (!member) throw new ForbiddenError();
    }

    const data = req.validated;
    const tracks = data.tracks || [];
    delete data.tracks;

    db.transaction(() => {
      db.prepare(`
        UPDATE conferences SET name=?, slug=?, edition=?, description=?, logo_url=?, website_url=?,
          location=?, start_date=?, end_date=?, submission_deadline=?, notification_date=?,
          camera_ready_date=?, is_active=?, is_double_blind=?, min_reviewers=?, max_file_size_mb=?,
          custom_fields=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(
        data.name, data.slug, data.edition || null, data.description || null,
        data.logo_url || null, data.website_url || null, data.location || null,
        data.start_date || null, data.end_date || null, data.submission_deadline,
        data.notification_date || null, data.camera_ready_date || null,
        data.is_active !== false ? 1 : 0, data.is_double_blind !== false ? 1 : 0,
        data.min_reviewers || 2, data.max_file_size_mb || 10, data.custom_fields || null,
        confId
      );

      db.prepare('DELETE FROM tracks WHERE conference_id = ?').run(confId);
      const insertTrack = db.prepare(
        'INSERT INTO tracks (conference_id, name, description, sort_order) VALUES (?, ?, ?, ?)'
      );
      for (let i = 0; i < tracks.length; i++) {
        insertTrack.run(confId, tracks[i].name, tracks[i].description || null, tracks[i].sort_order || i);
      }
    })();

    const conference = db.prepare('SELECT * FROM conferences WHERE id = ?').get(confId);
    const confTracks = db.prepare('SELECT * FROM tracks WHERE conference_id = ? ORDER BY sort_order').all(confId);

    res.json({ ...conference, tracks: confTracks });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('superadmin'), (req, res, next) => {
  try {
    const db = getDb();
    const confId = parseInt(req.params.id, 10);
    const conf = db.prepare('SELECT id FROM conferences WHERE id = ?').get(confId);
    if (!conf) throw new NotFoundError('Conferencia no encontrada');

    db.prepare('DELETE FROM conferences WHERE id = ?').run(confId);
    res.json({ message: 'Conferencia eliminada' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
