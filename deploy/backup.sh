#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Backup automático de MariaDB
#  Ejecutado vía cron diario a las 3:00 AM
# ============================================================================
set -euo pipefail

APP_DIR="/var/www/openpapers"
BACKUP_DIR="${APP_DIR}/storage/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ── Cargar credenciales desde .env ──────────────────────────────────────────
if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "[$(date)] ERROR: Archivo .env no encontrado"
  exit 1
fi

DB_DATABASE=$(grep -E '^DB_DATABASE=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '"')
DB_USERNAME=$(grep -E '^DB_USERNAME=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '"')
DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '"')
DB_HOST=$(grep -E '^DB_HOST=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '"')
DB_PORT=$(grep -E '^DB_PORT=' "${APP_DIR}/.env" | cut -d= -f2 | tr -d '"')

mkdir -p "$BACKUP_DIR"

# ── Dump de MariaDB ─────────────────────────────────────────────────────────
echo "[$(date)] Iniciando backup de ${DB_DATABASE}..."

BACKUP_FILE="${BACKUP_DIR}/openpapers_${TIMESTAMP}.sql"

mysqldump \
  --host="${DB_HOST:-127.0.0.1}" \
  --port="${DB_PORT:-3306}" \
  --user="${DB_USERNAME}" \
  --password="${DB_PASSWORD}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DB_DATABASE}" > "$BACKUP_FILE"

# ── Comprimir ───────────────────────────────────────────────────────────────
if [[ -f "$BACKUP_FILE" ]]; then
  gzip "$BACKUP_FILE"
  FINAL="${BACKUP_FILE}.gz"
  SIZE=$(du -h "$FINAL" | cut -f1)
  echo "[$(date)] Backup completado: $FINAL ($SIZE)"
else
  echo "[$(date)] ERROR: Backup falló"
  exit 1
fi

# ── Backup de uploads ───────────────────────────────────────────────────────
UPLOADS_DIR="${APP_DIR}/storage/app/submissions"
if [[ -d "$UPLOADS_DIR" ]]; then
  UPLOADS_BACKUP="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
  tar -czf "$UPLOADS_BACKUP" -C "${APP_DIR}/storage/app" submissions 2>/dev/null || true
  echo "[$(date)] Backup de uploads: $UPLOADS_BACKUP"
fi

# ── Limpiar backups antiguos ────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "openpapers_*.sql.gz" -mtime +${RETENTION_DAYS} -type f -delete -print | wc -l)
DELETED_UPL=$(find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +${RETENTION_DAYS} -type f -delete -print | wc -l)
TOTAL_DEL=$((DELETED + DELETED_UPL))
if [[ $TOTAL_DEL -gt 0 ]]; then
  echo "[$(date)] $TOTAL_DEL backups antiguos eliminados (>${RETENTION_DAYS} días)"
fi

TOTAL=$(find "$BACKUP_DIR" -name "openpapers_*.sql.gz" -type f | wc -l)
echo "[$(date)] Total de backups almacenados: $TOTAL"
