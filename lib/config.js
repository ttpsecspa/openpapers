const path = require('path');
const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

function requireInProduction(envVar, name) {
  const value = process.env[envVar];
  if (isProduction && !value) {
    throw new Error(`${name} (${envVar}) must be set in production`);
  }
  if (!value) {
    const generated = crypto.randomBytes(32).toString('hex');
    console.warn(`WARNING: ${name} not set. Using random ephemeral value. Set ${envVar} for persistence.`);
    return generated;
  }
  return value;
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: requireInProduction('JWT_SECRET', 'JWT secret'),
    refreshSecret: requireInProduction('JWT_REFRESH_SECRET', 'JWT refresh secret'),
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  db: {
    path: process.env.DB_PATH || path.join(process.cwd(), 'data', 'openpapers.db'),
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'OpenPapers',
    fromEmail: process.env.SMTP_FROM_EMAIL || '',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@openpapers.local',
    password: requireInProduction('ADMIN_PASSWORD', 'Admin password'),
    name: process.env.ADMIN_NAME || 'Administrador',
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
};

module.exports = config;
