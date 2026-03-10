const crypto = require('crypto');

function generateTrackingCode(db, slug, year) {
  const sanitized = slug.replace(/-/g, '').toUpperCase();
  const prefix = `CFP-${sanitized}-${year}`;
  const pattern = `${prefix}-%`;

  const row = db.prepare(
    'SELECT COALESCE(MAX(CAST(SUBSTR(tracking_code, LENGTH(?) + 2) AS INTEGER)), 0) + 1 AS seq FROM submissions WHERE tracking_code LIKE ?'
  ).get(prefix, pattern);

  return `${prefix}-${String(row.seq).padStart(4, '0')}`;
}

function generateRandomPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

module.exports = { generateTrackingCode, generateRandomPassword };
