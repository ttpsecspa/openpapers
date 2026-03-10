const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');
const { ValidationError } = require('../utils/errors');

if (!fs.existsSync(config.app.uploadDir)) {
  fs.mkdirSync(config.app.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.app.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  },
});

// NOTE: MIME type from multer relies on the Content-Type header, which can be spoofed.
// For stronger validation, consider using the 'file-type' package to check magic bytes
// on the saved file after upload (e.g. via a post-upload middleware).
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype !== 'application/pdf' || ext !== '.pdf') {
    cb(new ValidationError('Solo se permiten archivos PDF'), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.app.maxFileSizeMb * 1024 * 1024,
  },
});

module.exports = { upload };
