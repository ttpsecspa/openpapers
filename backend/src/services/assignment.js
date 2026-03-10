const { getDb } = require('../database/init');

function getAvailableReviewers(conferenceId, trackId) {
  const db = getDb();
  let query = `
    SELECT u.id, u.email, u.full_name, cm.tracks,
      (SELECT COUNT(*) FROM review_assignments ra WHERE ra.reviewer_id = u.id AND ra.status != 'declined') as current_load
    FROM users u
    JOIN conference_members cm ON cm.user_id = u.id AND cm.conference_id = ?
    WHERE u.is_active = 1 AND cm.role = 'reviewer'
  `;
  const reviewers = db.prepare(query).all(conferenceId);

  if (trackId) {
    return reviewers.filter(r => {
      if (!r.tracks) return true;
      const trackIds = JSON.parse(r.tracks);
      return trackIds.includes(trackId);
    });
  }

  return reviewers;
}

function autoAssign(conferenceId) {
  const db = getDb();
  const conference = db.prepare('SELECT * FROM conferences WHERE id = ?').get(conferenceId);
  if (!conference) return { error: 'Conferencia no encontrada' };

  const minReviewers = conference.min_reviewers || 2;

  const submissions = db.prepare(`
    SELECT s.id, s.track_id, s.authors_json
    FROM submissions s
    WHERE s.conference_id = ? AND s.status IN ('submitted', 'under_review')
  `).all(conferenceId);

  const reviewers = getAvailableReviewers(conferenceId);
  const assignments = [];
  const errors = [];

  db.transaction(() => {
    for (const sub of submissions) {
      const existingCount = db.prepare(
        'SELECT COUNT(*) as c FROM review_assignments WHERE submission_id = ?'
      ).get(sub.id).c;

      const needed = minReviewers - existingCount;
      if (needed <= 0) continue;

      const authors = JSON.parse(sub.authors_json || '[]');
      const authorEmails = authors.map(a => a.email?.toLowerCase()).filter(Boolean);

      const existingReviewers = db.prepare(
        'SELECT reviewer_id FROM review_assignments WHERE submission_id = ?'
      ).all(sub.id).map(r => r.reviewer_id);

      let eligible = reviewers
        .filter(r => !authorEmails.includes(r.email.toLowerCase()))
        .filter(r => !existingReviewers.includes(r.id))
        .filter(r => {
          if (!sub.track_id || !r.tracks) return true;
          const trackIds = JSON.parse(r.tracks);
          return trackIds.includes(sub.track_id);
        });

      eligible.sort((a, b) => a.current_load - b.current_load);

      const selected = eligible.slice(0, needed);

      if (selected.length < needed) {
        errors.push({ submission_id: sub.id, message: `Solo ${selected.length} de ${needed} revisores disponibles` });
      }

      for (const reviewer of selected) {
        db.prepare(`
          INSERT OR IGNORE INTO review_assignments (submission_id, reviewer_id, status)
          VALUES (?, ?, 'pending')
        `).run(sub.id, reviewer.id);
        reviewer.current_load++;
        assignments.push({ submission_id: sub.id, reviewer_id: reviewer.id });
      }

      if (sub.status === 'submitted' && selected.length > 0) {
        db.prepare("UPDATE submissions SET status = 'under_review', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(sub.id);
      }
    }
  })();

  return { assignments: assignments.length, errors };
}

module.exports = { getAvailableReviewers, autoAssign };
