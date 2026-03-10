#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Backup automático de base de datos SQLite
#  Ejecutado vía cron diario a las 3:00 AM
# ============================================================================
set -euo pipefail

APP_DIR="/opt/openpapers"
BACKUP_DIR="${APP_DIR}/data/backups"
DB_PATH="${APP_DIR}/data/openpapers.db"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/openpapers_${TIMESTAMP}.db"

# ── Crear directorio si no existe ────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Verificar que la base de datos existe ────────────────────────────────────
if [[ ! -f "$DB_PATH" ]]; then
  echo "[$(date)] ERROR: Base de datos no encontrada en $DB_PATH"
  exit 1
fi

# ── Backup atómico con sqlite3 .backup ───────────────────────────────────────
# Usa el comando .backup de SQLite que es seguro incluso con la DB en uso (WAL mode)
echo "[$(date)] Iniciando backup..."

docker compose -f "${APP_DIR}/docker-compose.yml" exec -T backend \
  sqlite3 /app/data/openpapers.db ".backup '/app/data/backups/openpapers_${TIMESTAMP}.db'" 2>/dev/null \
  || sqlite3 "$DB_PATH" ".backup '${BACKUP_FILE}'"

# ── Comprimir ────────────────────────────────────────────────────────────────
if [[ -f "$BACKUP_FILE" ]]; then
  gzip "$BACKUP_FILE"
  FINAL="${BACKUP_FILE}.gz"
  SIZE=$(du -h "$FINAL" | cut -f1)
  echo "[$(date)] Backup completado: $FINAL ($SIZE)"
else
  echo "[$(date)] ERROR: Backup falló — archivo no creado"
  exit 1
fi

# ── Limpiar backups antiguos ─────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "openpapers_*.db.gz" -mtime +${RETENTION_DAYS} -type f -delete -print | wc -l)
if [[ $DELETED -gt 0 ]]; then
  echo "[$(date)] $DELETED backups antiguos eliminados (>${RETENTION_DAYS} días)"
fi

# ── Listar backups actuales ──────────────────────────────────────────────────
TOTAL=$(find "$BACKUP_DIR" -name "openpapers_*.db.gz" -type f | wc -l)
echo "[$(date)] Total de backups almacenados: $TOTAL"
