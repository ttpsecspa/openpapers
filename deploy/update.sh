#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Script de actualización
#  Uso:  cd /opt/openpapers && bash deploy/update.sh
# ============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }
step() { echo -e "\n${CYAN}${BOLD}── $* ──${NC}"; }

APP_DIR="/opt/openpapers"
cd "$APP_DIR"

step "Actualizando OpenPapers"

# ── Verificar que estamos en el directorio correcto ──────────────────────────
if [[ ! -f "docker-compose.yml" ]]; then
  err "No se encontró docker-compose.yml en $APP_DIR"
  exit 1
fi

# ── Backup pre-actualización ─────────────────────────────────────────────────
step "Creando backup pre-actualización"
if [[ -f "deploy/backup.sh" ]]; then
  bash deploy/backup.sh
  log "Backup completado"
else
  warn "Script de backup no encontrado — continuando sin backup"
fi

# ── Pull cambios ─────────────────────────────────────────────────────────────
step "Descargando cambios"
CURRENT=$(git rev-parse --short HEAD)
git pull origin main
NEW=$(git rev-parse --short HEAD)

if [[ "$CURRENT" == "$NEW" ]]; then
  log "Ya estás en la última versión ($CURRENT)"
  echo -e "${YELLOW}¿Deseas reconstruir los contenedores de todas formas? (s/N)${NC}"
  read -r REPLY
  if [[ ! "$REPLY" =~ ^[sS]$ ]]; then
    log "Nada que hacer"
    exit 0
  fi
else
  log "Actualizado: $CURRENT → $NEW"
  git log --oneline "${CURRENT}..${NEW}"
fi

# ── Rebuild contenedores ─────────────────────────────────────────────────────
step "Reconstruyendo contenedores"
docker compose build --no-cache
log "Build completado"

# ── Reiniciar servicios ──────────────────────────────────────────────────────
step "Reiniciando servicios"
docker compose down
docker compose up -d
log "Servicios reiniciados"

# ── Health check ─────────────────────────────────────────────────────────────
step "Verificando salud del servicio"
echo -n "Esperando respuesta del backend"
HEALTHY=false
for i in $(seq 1 20); do
  if docker compose exec -T backend wget -q --spider http://localhost:3001/api/conferences 2>/dev/null; then
    echo ""
    HEALTHY=true
    break
  fi
  echo -n "."
  sleep 3
done
echo ""

if [[ "$HEALTHY" == "true" ]]; then
  log "Backend respondiendo correctamente"
else
  err "Backend no responde después de 60 segundos"
  warn "Revisa los logs: docker compose logs backend"
  exit 1
fi

# ── Limpiar imágenes antiguas ────────────────────────────────────────────────
step "Limpiando imágenes Docker antiguas"
docker image prune -f
log "Imágenes antiguas eliminadas"

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Actualización completada exitosamente${NC}"
echo -e "  Versión: ${CYAN}$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)${NC}"
echo -e "  Estado:  ${GREEN}Todos los servicios activos${NC}"
echo ""
docker compose ps
