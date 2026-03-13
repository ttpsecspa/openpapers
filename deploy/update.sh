#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Script de actualización (Laravel + PHP)
#  Uso:  cd /var/www/openpapers && sudo bash deploy/update.sh
# ============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }
step() { echo -e "\n${CYAN}${BOLD}── $* ──${NC}"; }

APP_DIR="/var/www/openpapers"
cd "$APP_DIR"

# ── Verificar directorio ────────────────────────────────────────────────────
if [[ ! -f "artisan" ]]; then
  err "No se encontró artisan en $APP_DIR"
  exit 1
fi

# ── Backup pre-actualización ────────────────────────────────────────────────
step "Creando backup pre-actualización"
if [[ -f "deploy/backup.sh" ]]; then
  bash deploy/backup.sh
  log "Backup completado"
else
  warn "Script de backup no encontrado"
fi

# ── Modo mantenimiento ──────────────────────────────────────────────────────
step "Activando modo mantenimiento"
php artisan down --retry=60

# ── Pull cambios ────────────────────────────────────────────────────────────
step "Descargando cambios"
CURRENT=$(git rev-parse --short HEAD)
git pull origin main
NEW=$(git rev-parse --short HEAD)

if [[ "$CURRENT" == "$NEW" ]]; then
  log "Ya estás en la última versión ($CURRENT)"
else
  log "Actualizado: $CURRENT → $NEW"
  git log --oneline "${CURRENT}..${NEW}"
fi

# ── Actualizar dependencias ─────────────────────────────────────────────────
step "Actualizando dependencias PHP"
composer install --no-dev --optimize-autoloader --no-interaction
log "Dependencias actualizadas"

# ── Migrar BD ───────────────────────────────────────────────────────────────
step "Ejecutando migraciones"
php artisan migrate --force
log "Migraciones ejecutadas"

# ── Optimizar ───────────────────────────────────────────────────────────────
step "Optimizando para producción"
php artisan config:cache
php artisan route:cache
php artisan view:cache
log "Cachés regenerados"

# ── Permisos ────────────────────────────────────────────────────────────────
chown -R www-data:www-data "$APP_DIR"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"

# ── Desactivar mantenimiento ────────────────────────────────────────────────
step "Desactivando modo mantenimiento"
php artisan up
log "Sitio activo"

# ── Reiniciar PHP-FPM ───────────────────────────────────────────────────────
systemctl reload php8.3-fpm 2>/dev/null || systemctl reload php8.2-fpm 2>/dev/null || true
log "PHP-FPM recargado"

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Actualización completada${NC}"
echo -e "  Versión: ${CYAN}$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)${NC}"
echo ""
