const { getDb } = require('../database/init');

function getStats(conferenceId) {
  const db = getDb();
  const whereConf = conferenceId ? 'WHERE s.conference_id = ?' : '';
  const params = conferenceId ? [conferenceId] : [];

  const total = db.prepare(`SELECT COUNT(*) as c FROM submissions s ${whereConf}`).get(...params).c;

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM submissions s ${whereConf} GROUP BY status
  `).all(...params);
  const statusMap = {};
  byStatus.forEach(r => { statusMap[r.status] = r.count; });

  const byTrack = db.prepare(`
    SELECT COALESCE(t.name, 'Sin track') as track, COUNT(*) as count
    FROM submissions s LEFT JOIN tracks t ON t.id = s.track_id
    ${whereConf} GROUP BY t.name ORDER BY count DESC
  `).all(...params);

  const byDate = db.prepare(`
    SELECT DATE(s.submitted_at) as date, COUNT(*) as count
    FROM submissions s ${whereConf}
    GROUP BY DATE(s.submitted_at) ORDER BY date
  `).all(...params);

  const reviewWhereConf = conferenceId
    ? 'WHERE r.submission_id IN (SELECT id FROM submissions WHERE conference_id = ?)'
    : '';

  const reviewTotal = db.prepare(`SELECT COUNT(*) as c FROM reviews r ${reviewWhereConf}`).get(...params).c;

  const assignmentWhereConf = conferenceId
    ? 'WHERE ra.submission_id IN (SELECT id FROM submissions WHERE conference_id = ?)'
    : '';

  const pending = db.prepare(`
    SELECT COUNT(*) as c FROM review_assignments ra ${assignmentWhereConf ? assignmentWhereConf + " AND ra.status = 'pending'" : "WHERE ra.status = 'pending'"}
  `).get(...params).c;

  const completed = db.prepare(`
    SELECT COUNT(*) as c FROM review_assignments ra ${assignmentWhereConf ? assignmentWhereConf + " AND ra.status = 'completed'" : "WHERE ra.status = 'completed'"}
  `).get(...params).c;

  const avgScoreRow = db.prepare(`SELECT AVG(overall_score) as avg FROM reviews r ${reviewWhereConf}`).get(...params);
  const avgScore = avgScoreRow.avg ? parseFloat(avgScoreRow.avg.toFixed(1)) : 0;

  const scoreDist = { '1-3': 0, '4-5': 0, '6-7': 0, '8-10': 0 };
  const scores = db.prepare(`SELECT overall_score FROM reviews r ${reviewWhereConf}`).all(...params);
  scores.forEach(({ overall_score: s }) => {
    if (s <= 3) scoreDist['1-3']++;
    else if (s <= 5) scoreDist['4-5']++;
    else if (s <= 7) scoreDist['6-7']++;
    else scoreDist['8-10']++;
  });

  const reviewerMemberWhere = conferenceId
    ? "WHERE cm.conference_id = ? AND cm.role = 'reviewer'"
    : "WHERE cm.role = 'reviewer'";
  const totalReviewers = db.prepare(`
    SELECT COUNT(DISTINCT cm.user_id) as c FROM conference_members cm ${reviewerMemberWhere}
  `).get(...params).c;

  const activeReviewers = db.prepare(`
    SELECT COUNT(DISTINCT ra.reviewer_id) as c FROM review_assignments ra ${assignmentWhereConf}
  `).get(...params).c;

  const avgLoad = totalReviewers > 0 ? parseFloat(((pending + completed) / totalReviewers).toFixed(1)) : 0;
  const completionRate = (pending + completed) > 0 ? parseFloat((completed / (pending + completed)).toFixed(2)) : 0;

  let timeline = {};
  if (conferenceId) {
    const conf = db.prepare('SELECT submission_deadline FROM conferences WHERE id = ?').get(conferenceId);
    if (conf) {
      const deadline = new Date(conf.submission_deadline);
      const now = new Date();
      const diffMs = deadline - now;
      timeline = {
        days_to_deadline: Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))),
        submission_deadline: conf.submission_deadline,
      };
    }
  }

  return {
    submissions: { total, by_status: statusMap, by_track: byTrack, by_date: byDate },
    reviews: { total: reviewTotal, pending, completed, avg_score: avgScore, score_distribution: scoreDist },
    reviewers: { total: totalReviewers, active: activeReviewers, avg_load: avgLoad, completion_rate: completionRate },
    timeline,
  };
}

module.exports = { getStats };
