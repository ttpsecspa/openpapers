const bcrypt = require('bcrypt');
const config = require('../config');
const { getDb } = require('./init');

async function runSeeds() {
  const db = getDb();

  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('superadmin');
  if (existingAdmin) {
    console.log('Seeds already applied, skipping.');
    return;
  }

  console.log('Running seeds...');

  const passwordHash = await bcrypt.hash(config.admin.password, 10);
  const adminResult = db.prepare(
    'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)'
  ).run(config.admin.email, passwordHash, config.admin.name, 'superadmin');
  const adminId = adminResult.lastInsertRowid;

  const confResult = db.prepare(`
    INSERT INTO conferences (name, slug, edition, description, location, submission_deadline, notification_date, camera_ready_date, is_active, is_double_blind, min_reviewers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 2)
  `).run(
    '8.8 Security Conference',
    '8dot8-2026',
    '2026',
    'Conferencia de seguridad informática líder en Latinoamérica. Buscamos papers originales en todas las áreas de ciberseguridad.',
    'Santiago, Chile',
    '2026-04-30',
    '2026-06-15',
    '2026-07-15'
  );
  const confId = confResult.lastInsertRowid;

  const tracks = [
    { name: 'Seguridad Ofensiva', description: 'Pentesting, exploit development, red teaming', order: 1 },
    { name: 'Seguridad OT/ICS', description: 'Seguridad en sistemas de control industrial y SCADA', order: 2 },
    { name: 'Criptografía y Privacidad', description: 'Protocolos criptográficos, privacidad diferencial, anonimización', order: 3 },
    { name: 'Seguridad en la Nube', description: 'Seguridad cloud-native, contenedores, serverless', order: 4 },
  ];

  const insertTrack = db.prepare(
    'INSERT INTO tracks (conference_id, name, description, sort_order) VALUES (?, ?, ?, ?)'
  );
  for (const t of tracks) {
    insertTrack.run(confId, t.name, t.description, t.order);
  }

  db.prepare(
    'INSERT INTO conference_members (conference_id, user_id, role) VALUES (?, ?, ?)'
  ).run(confId, adminId, 'chair');

  const reviewer1Hash = await bcrypt.hash('Reviewer123!', 10);
  const r1 = db.prepare(
    'INSERT INTO users (email, password_hash, full_name, affiliation, role) VALUES (?, ?, ?, ?, ?)'
  ).run('reviewer1@openpapers.local', reviewer1Hash, 'María García', 'Universidad de Chile', 'reviewer');

  const reviewer2Hash = await bcrypt.hash('Reviewer123!', 10);
  const r2 = db.prepare(
    'INSERT INTO users (email, password_hash, full_name, affiliation, role) VALUES (?, ?, ?, ?, ?)'
  ).run('reviewer2@openpapers.local', reviewer2Hash, 'Carlos López', 'USACH', 'reviewer');

  db.prepare(
    'INSERT INTO conference_members (conference_id, user_id, role, tracks) VALUES (?, ?, ?, ?)'
  ).run(confId, r1.lastInsertRowid, 'reviewer', JSON.stringify([1, 2]));

  db.prepare(
    'INSERT INTO conference_members (conference_id, user_id, role, tracks) VALUES (?, ?, ?, ?)'
  ).run(confId, r2.lastInsertRowid, 'reviewer', JSON.stringify([3, 4]));

  console.log('Seeds completed successfully.');
}

module.exports = { runSeeds };
