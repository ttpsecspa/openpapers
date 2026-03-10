#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Script de despliegue para DigitalOcean (Ubuntu 24.04 LTS)
#  Uso:  sudo bash setup.sh --domain cfp.tudominio.cl --email admin@tudominio.cl
# ============================================================================
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*" >&2; }
step() { echo -e "\n${CYAN}${BOLD}── $* ──${NC}"; }

# ── Argumentos ───────────────────────────────────────────────────────────────
DOMAIN=""
EMAIL=""
REPO="https://github.com/ttpsecspa/openpapers.git"
APP_DIR="/opt/openpapers"
BRANCH="main"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""

usage() {
  cat <<EOF
Uso: sudo bash setup.sh [opciones]

Opciones requeridas:
  --domain DOMINIO        Dominio del sitio (ej: cfp.miconferencia.cl)
  --email  EMAIL          Email del administrador (para Let's Encrypt y login)

Opciones de SMTP (opcionales, se pueden configurar después en .env):
  --smtp-host HOST        Servidor SMTP (default: smtp.gmail.com)
  --smtp-port PORT        Puerto SMTP (default: 587)
  --smtp-user USER        Usuario SMTP
  --smtp-pass PASS        Contraseña SMTP

Otras opciones:
  --repo   URL            URL del repositorio Git (default: $REPO)
  --branch RAMA           Rama a desplegar (default: main)
  --help                  Mostrar esta ayuda
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)     DOMAIN="$2";    shift 2 ;;
    --email)      EMAIL="$2";     shift 2 ;;
    --repo)       REPO="$2";     shift 2 ;;
    --branch)     BRANCH="$2";   shift 2 ;;
    --smtp-host)  SMTP_HOST="$2"; shift 2 ;;
    --smtp-port)  SMTP_PORT="$2"; shift 2 ;;
    --smtp-user)  SMTP_USER="$2"; shift 2 ;;
    --smtp-pass)  SMTP_PASS="$2"; shift 2 ;;
    --help)       usage ;;
    *) err "Argumento desconocido: $1"; usage ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  err "Se requieren --domain y --email"
  usage
fi

# ── Validaciones ─────────────────────────────────────────────────────────────
step "Validando entorno"

if [[ $EUID -ne 0 ]]; then
  err "Este script debe ejecutarse como root (sudo)"
  exit 1
fi

if ! grep -qi "ubuntu" /etc/os-release 2>/dev/null; then
  err "Este script está diseñado para Ubuntu 22.04/24.04 LTS"
  exit 1
fi

log "Ubuntu detectado — ejecutando como root"
log "Dominio: $DOMAIN"
log "Email admin: $EMAIL"

# ── Actualizar sistema ──────────────────────────────────────────────────────
step "Actualizando sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log "Sistema actualizado"

# ── Instalar dependencias ───────────────────────────────────────────────────
step "Instalando dependencias"
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  ufw fail2ban unattended-upgrades \
  certbot sqlite3 git
log "Dependencias instaladas"

# ── Instalar Docker ─────────────────────────────────────────────────────────
step "Instalando Docker"
if command -v docker &>/dev/null; then
  log "Docker ya está instalado ($(docker --version))"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  log "Docker instalado ($(docker --version))"
fi

# ── Firewall (UFW) ──────────────────────────────────────────────────────────
step "Configurando firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
echo "y" | ufw enable
log "UFW activado — puertos 22, 80, 443 abiertos"

# ── Fail2ban ─────────────────────────────────────────────────────────────────
step "Configurando fail2ban"
systemctl enable fail2ban
systemctl start fail2ban
log "fail2ban activo"

# ── Actualizaciones automáticas ──────────────────────────────────────────────
step "Configurando actualizaciones automáticas de seguridad"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APTCONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APTCONF
log "Unattended-upgrades configurado"

# ── Clonar repositorio ──────────────────────────────────────────────────────
step "Clonando OpenPapers"
if [[ -d "$APP_DIR" ]]; then
  warn "Directorio $APP_DIR ya existe — actualizando"
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi
log "Repositorio clonado en $APP_DIR"

# ── Generar .env ─────────────────────────────────────────────────────────────
step "Generando archivo .env"
ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9!@#' | head -c 20)
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH=$(openssl rand -base64 48)

if [[ -f "$APP_DIR/.env" ]]; then
  warn "Archivo .env ya existe — no se sobreescribirá"
  warn "Si necesitas regenerar, elimínalo y ejecuta el script de nuevo"
else
  cat > "$APP_DIR/.env" <<ENVFILE
# ── Server ──
NODE_ENV=production
PORT=3001
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ── Database ──
DB_PATH=./data/openpapers.db

# ── SMTP ──
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=false
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM_NAME=OpenPapers
SMTP_FROM_EMAIL=${SMTP_USER:-noreply@${DOMAIN}}

# ── Admin inicial ──
ADMIN_EMAIL=${EMAIL}
ADMIN_PASSWORD=${ADMIN_PASS}
ADMIN_NAME=Administrador

# ── App ──
APP_URL=https://${DOMAIN}
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE_MB=10
ENVFILE
  chmod 600 "$APP_DIR/.env"
  log "Archivo .env generado con secretos seguros"
fi

# ── Crear directorio de datos ────────────────────────────────────────────────
mkdir -p "$APP_DIR/data/uploads"
mkdir -p "$APP_DIR/data/backups"
log "Directorios de datos creados"

# ── Configurar Nginx con SSL ────────────────────────────────────────────────
step "Configurando Nginx con SSL"

# Primero arrancar sin SSL para obtener certificado
cat > "$APP_DIR/nginx/default.conf" <<'NGINX_TEMP'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
NGINX_TEMP

# Crear directorio para certbot
mkdir -p /var/www/certbot

# ── Obtener certificado SSL ─────────────────────────────────────────────────
step "Obteniendo certificado SSL con Let's Encrypt"

# Detener cualquier servicio en puerto 80
systemctl stop nginx 2>/dev/null || true

certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --domain "$DOMAIN" \
  --preferred-challenges http

if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  err "No se pudo obtener el certificado SSL"
  err "Verifica que el DNS de $DOMAIN apunte a esta IP"
  warn "Continuando sin SSL — puedes ejecutar certbot manualmente después"
  HAS_SSL=false
else
  log "Certificado SSL obtenido para $DOMAIN"
  HAS_SSL=true
fi

# ── Generar config Nginx definitiva ──────────────────────────────────────────
if [[ "$HAS_SSL" == "true" ]]; then
  cat > "$APP_DIR/nginx/default.conf" <<NGINX_SSL
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:80;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL
    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 15M;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX_SSL
  log "Nginx configurado con SSL (HTTPS)"
else
  # Sin SSL — usar config original
  cat > "$APP_DIR/nginx/default.conf" <<'NGINX_NO_SSL'
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 15M;

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_NO_SSL
  warn "Nginx configurado sin SSL (solo HTTP)"
fi

# ── Actualizar docker-compose para SSL ───────────────────────────────────────
if [[ "$HAS_SSL" == "true" ]]; then
  cat > "$APP_DIR/docker-compose.yml" <<'COMPOSE'
version: '3.8'

services:
  backend:
    build: ./backend
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/app/data
    networks:
      - internal

  frontend:
    build: ./frontend
    restart: unless-stopped
    networks:
      - internal

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - internal

networks:
  internal:
    driver: bridge
COMPOSE
  log "docker-compose.yml actualizado con puertos SSL y certificados"
fi

# ── Build y arrancar ─────────────────────────────────────────────────────────
step "Construyendo y arrancando contenedores"
cd "$APP_DIR"
docker compose build --no-cache
docker compose up -d
log "Contenedores arrancados"

# Esperar a que el backend esté listo
echo -n "Esperando que el backend inicie"
for i in $(seq 1 30); do
  if docker compose exec -T backend wget -q --spider http://localhost:3001/api/conferences 2>/dev/null; then
    echo ""
    log "Backend respondiendo"
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

# ── Servicio systemd ─────────────────────────────────────────────────────────
step "Configurando inicio automático"
cat > /etc/systemd/system/openpapers.service <<SYSTEMD
[Unit]
Description=OpenPapers - Call for Papers Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable openpapers.service
log "Servicio systemd registrado (arranca al boot)"

# ── Script de backup ─────────────────────────────────────────────────────────
step "Configurando backups automáticos"
chmod +x "$APP_DIR/deploy/backup.sh"

# Cron job: backup diario a las 3:00 AM
(crontab -l 2>/dev/null | grep -v "openpapers/deploy/backup.sh" ; \
  echo "0 3 * * * ${APP_DIR}/deploy/backup.sh >> /var/log/openpapers-backup.log 2>&1") | crontab -
log "Backup diario configurado (3:00 AM)"

# ── Renovación SSL automática ────────────────────────────────────────────────
if [[ "$HAS_SSL" == "true" ]]; then
  step "Configurando renovación SSL automática"
  (crontab -l 2>/dev/null | grep -v "certbot renew" ; \
    echo "0 4 * * 1 certbot renew --quiet --deploy-hook 'cd ${APP_DIR} && docker compose restart nginx'") | crontab -
  log "Renovación SSL cada lunes a las 4:00 AM"
fi

# ── Resumen final ────────────────────────────────────────────────────────────
step "¡Despliegue completado!"

PROTOCOL="http"
[[ "$HAS_SSL" == "true" ]] && PROTOCOL="https"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              OpenPapers — Despliegue Exitoso                ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  URL:       ${GREEN}${PROTOCOL}://${DOMAIN}${NC}                       "
echo -e "${BOLD}║${NC}  Admin:     ${CYAN}${EMAIL}${NC}                              "
echo -e "${BOLD}║${NC}  Password:  ${YELLOW}${ADMIN_PASS}${NC}                          "
echo -e "${BOLD}║${NC}  SSL:       $([ "$HAS_SSL" == "true" ] && echo "${GREEN}Activo ✓${NC}" || echo "${RED}Inactivo ✗${NC}")"
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  Directorio:  ${APP_DIR}                              "
echo -e "${BOLD}║${NC}  Backups:     ${APP_DIR}/data/backups                 "
echo -e "${BOLD}║${NC}  Logs:        docker compose logs -f                          "
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  ${YELLOW}⚠  CAMBIA LA CONTRASEÑA DE ADMIN DESPUÉS DEL PRIMER LOGIN${NC}  ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ${YELLOW}⚠  CONFIGURA SMTP EN .env PARA ENVIAR EMAILS${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Comandos útiles:"
echo -e "  ${CYAN}cd ${APP_DIR} && docker compose logs -f${NC}       Ver logs"
echo -e "  ${CYAN}cd ${APP_DIR} && docker compose restart${NC}       Reiniciar"
echo -e "  ${CYAN}cd ${APP_DIR} && bash deploy/update.sh${NC}        Actualizar"
echo -e "  ${CYAN}cd ${APP_DIR} && bash deploy/backup.sh${NC}        Backup manual"
echo ""
