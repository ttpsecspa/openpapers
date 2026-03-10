const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getDb } = require('../database/init');

let transporter = null;
const templateCache = new Map();

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTransporter() {
  if (!transporter && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

function loadTemplate(name) {
  if (templateCache.has(name)) return templateCache.get(name);
  const filePath = path.join(__dirname, 'templates', `${name}.html`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  templateCache.set(name, content);
  return content;
}

function renderTemplate(html, vars) {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), escapeHtml(value) || '');
  }
  return result;
}

async function sendEmail(to, subject, templateName, vars, conferenceId) {
  const db = getDb();
  const transport = getTransporter();

  if (!transport) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    db.prepare(
      'INSERT INTO email_log (conference_id, to_email, subject, template, status) VALUES (?, ?, ?, ?, ?)'
    ).run(conferenceId || null, to, subject, templateName, 'sent');
    return;
  }

  try {
    let html = loadTemplate(templateName);
    if (html) {
      html = renderTemplate(html, { ...vars, appUrl: config.app.url });
    } else {
      html = `<p>${subject}</p><pre>${JSON.stringify(vars, null, 2)}</pre>`;
    }

    await transport.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to,
      subject,
      html,
    });

    db.prepare(
      'INSERT INTO email_log (conference_id, to_email, subject, template, status) VALUES (?, ?, ?, ?, ?)'
    ).run(conferenceId || null, to, subject, templateName, 'sent');
  } catch (err) {
    db.prepare(
      'INSERT INTO email_log (conference_id, to_email, subject, template, status, error_message) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(conferenceId || null, to, subject, templateName, 'failed', err.message);
    throw err;
  }
}

const mailer = {
  sendSubmissionConfirmation(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Confirmación de envío - ${vars.trackingCode}`,
      'submission_confirmation', vars, conferenceId);
  },

  sendReviewAssignment(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Nueva revisión asignada`,
      'review_assignment', vars, conferenceId);
  },

  sendReviewReminder(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Recordatorio: revisiones pendientes`,
      'review_reminder', vars, conferenceId);
  },

  sendDecisionAccepted(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Paper ACEPTADO - ${vars.trackingCode}`,
      'decision_accepted', vars, conferenceId);
  },

  sendDecisionRejected(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Resultado de evaluación - ${vars.trackingCode}`,
      'decision_rejected', vars, conferenceId);
  },

  sendDecisionRevision(to, vars, conferenceId) {
    return sendEmail(to, `[${vars.conferenceName}] Correcciones solicitadas - ${vars.trackingCode}`,
      'decision_revision', vars, conferenceId);
  },
};

module.exports = mailer;
