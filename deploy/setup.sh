#!/usr/bin/env bash
# ============================================================================
#  OpenPapers — Script de despliegue para VPS Ubuntu (PHP + MariaDB + Nginx)
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
APP_DIR="/var/www/openpapers"
BRANCH="main"
DB_NAME="openpapers"
DB_USER="openpapers"

usage() {
  cat <<EOF
Uso: sudo bash setup.sh [opciones]

Opciones requeridas:
  --domain DOMINIO        Dominio del sitio (ej: cfp.miconferencia.cl)
  --email  EMAIL          Email del administrador (para Let's Encrypt y login)

Opciones adicionales:
  --repo   URL            URL del repositorio Git (default: $REPO)
  --branch RAMA           Rama a desplegar (default: main)
  --db-name NOMBRE        Nombre de la BD (default: openpapers)
  --help                  Mostrar esta ayuda
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)    DOMAIN="$2";  shift 2 ;;
    --email)     EMAIL="$2";   shift 2 ;;
    --repo)      REPO="$2";    shift 2 ;;
    --branch)    BRANCH="$2";  shift 2 ;;
    --db-name)   DB_NAME="$2"; shift 2 ;;
    --help)      usage ;;
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

log "Dominio: $DOMAIN"
log "Email admin: $EMAIL"

# ── Actualizar sistema ──────────────────────────────────────────────────────
step "Actualizando sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
log "Sistema actualizado"

# ── Instalar PHP 8.3 + extensiones ──────────────────────────────────────────
step "Instalando PHP 8.3 y extensiones"
apt-get install -y -qq software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update -qq
apt-get install -y -qq \
  php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-gd php8.3-intl php8.3-bcmath php8.3-tokenizer \
  php8.3-fileinfo php8.3-opcache php8.3-cli
log "PHP $(php -v | head -1 | awk '{print $2}') instalado"

# ── Instalar Composer ────────────────────────────────────────────────────────
step "Instalando Composer"
if command -v composer &>/dev/null; then
  log "Composer ya está instalado"
else
  curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
  log "Composer instalado"
fi

# ── Instalar MariaDB ────────────────────────────────────────────────────────
step "Instalando MariaDB"
apt-get install -y -qq mariadb-server mariadb-client
systemctl enable mariadb
systemctl start mariadb

DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
log "MariaDB configurado — BD: $DB_NAME, usuario: $DB_USER"

# ── Instalar Nginx ──────────────────────────────────────────────────────────
step "Instalando Nginx"
apt-get install -y -qq nginx
systemctl enable nginx
log "Nginx instalado"

# ── Firewall (UFW) ──────────────────────────────────────────────────────────
step "Configurando firewall"
apt-get install -y -qq ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
echo "y" | ufw enable
systemctl enable fail2ban
systemctl start fail2ban
log "UFW + fail2ban activos"

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

# ── Instalar dependencias PHP ────────────────────────────────────────────────
step "Instalando dependencias con Composer"
cd "$APP_DIR"
composer install --no-dev --optimize-autoloader --no-interaction
log "Dependencias instaladas"

# ── Permisos ─────────────────────────────────────────────────────────────────
step "Configurando permisos"
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"
log "Permisos configurados"

# ── Generar .env ─────────────────────────────────────────────────────────────
step "Generando archivo .env"
ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 16)
APP_KEY_RAW=$(openssl rand -base64 32)

if [[ -f "$APP_DIR/.env" ]]; then
  warn "Archivo .env ya existe — no se sobreescribirá"
else
  cat > "$APP_DIR/.env" <<ENVFILE
APP_NAME=OpenPapers
APP_ENV=production
APP_KEY=base64:${APP_KEY_RAW}
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=https://${DOMAIN}

APP_LOCALE=es
APP_FALLBACK_LOCALE=en

APP_MAINTENANCE_DRIVER=file
BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD="${DB_PASS}"

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=strict

FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
CACHE_STORE=database
CACHE_PREFIX=openpapers_

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@${DOMAIN}
MAIL_FROM_NAME="\${APP_NAME}"

ADMIN_EMAIL=${EMAIL}
ADMIN_PASSWORD="${ADMIN_PASS}"
ADMIN_NAME=Administrador
MAX_FILE_SIZE_MB=10
MIN_REVIEWERS=2
ENVFILE
  chmod 600 "$APP_DIR/.env"
  log "Archivo .env generado"
fi

# ── Migrar y sembrar BD ──────────────────────────────────────────────────────
step "Ejecutando migraciones"
cd "$APP_DIR"
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link 2>/dev/null || true
log "Base de datos migrada y superadmin creado"

# ── Optimizar Laravel ────────────────────────────────────────────────────────
step "Optimizando para producción"
php artisan config:cache
php artisan route:cache
php artisan view:cache
log "Cachés de Laravel generados"

# ── Lock de instalación ──────────────────────────────────────────────────────
echo "{\"installed_at\":\"$(date -Iseconds)\",\"php_version\":\"$(php -v | head -1 | awk '{print $2}')\"}" > "$APP_DIR/storage/installed.lock"
# Eliminar instalador web
rm -f "$APP_DIR/public/install.php"
log "Archivo install.php eliminado por seguridad"

# ── Certificado SSL ──────────────────────────────────────────────────────────
step "Obteniendo certificado SSL con Let's Encrypt"
apt-get install -y -qq certbot python3-certbot-nginx
systemctl stop nginx 2>/dev/null || true

certbot certonly --standalone \
  --non-interactive --agree-tos \
  --email "$EMAIL" --domain "$DOMAIN" \
  --preferred-challenges http

HAS_SSL=false
if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
  HAS_SSL=true
  log "Certificado SSL obtenido"
else
  warn "No se pudo obtener SSL — verifica el DNS"
fi

# ── Configurar Nginx ────────────────────────────────────────────────────────
step "Configurando Nginx"
cat > /etc/nginx/sites-available/openpapers <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    $(if [[ "$HAS_SSL" == "true" ]]; then
    echo "listen 443 ssl http2;"
    echo "ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;"
    echo "ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;"
    echo "ssl_protocols TLSv1.2 TLSv1.3;"
    echo "ssl_ciphers HIGH:!aNULL:!MD5;"
    echo "ssl_prefer_server_ciphers on;"
    else
    echo "listen 80;"
    fi)

    server_name ${DOMAIN};
    root ${APP_DIR}/public;
    index index.php;

    client_max_body_size 15M;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Block install.php
    location = /install.php {
        return 403;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/openpapers /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl start nginx
systemctl reload nginx
log "Nginx configurado"

# ── Renovación SSL ──────────────────────────────────────────────────────────
if [[ "$HAS_SSL" == "true" ]]; then
  (crontab -l 2>/dev/null | grep -v "certbot renew" ; \
    echo "0 4 * * 1 certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
  log "Renovación SSL automática configurada"
fi

# ── Backup cron ──────────────────────────────────────────────────────────────
step "Configurando backups"
chmod +x "$APP_DIR/deploy/backup.sh" 2>/dev/null || true
(crontab -l 2>/dev/null | grep -v "openpapers/deploy/backup.sh" ; \
  echo "0 3 * * * ${APP_DIR}/deploy/backup.sh >> /var/log/openpapers-backup.log 2>&1") | crontab -
log "Backup diario configurado (3:00 AM)"

# ── Resumen ──────────────────────────────────────────────────────────────────
step "Despliegue completado"

PROTOCOL="http"
[[ "$HAS_SSL" == "true" ]] && PROTOCOL="https"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║              OpenPapers — Despliegue Exitoso                ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  URL:       ${GREEN}${PROTOCOL}://${DOMAIN}${NC}"
echo -e "${BOLD}║${NC}  Admin:     ${CYAN}${EMAIL}${NC}"
echo -e "${BOLD}║${NC}  Password:  ${YELLOW}${ADMIN_PASS}${NC}"
echo -e "${BOLD}║${NC}  SSL:       $([ "$HAS_SSL" == "true" ] && echo "${GREEN}Activo${NC}" || echo "${RED}Inactivo${NC}")"
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  Stack:     PHP 8.3 + MariaDB + Nginx"
echo -e "${BOLD}║${NC}  Directorio: ${APP_DIR}"
echo -e "${BOLD}║${NC}                                                              ${BOLD}║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}  ${YELLOW}CAMBIA LA CONTRASENA DESPUES DEL PRIMER LOGIN${NC}              ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ${YELLOW}CONFIGURA SMTP EN .env PARA ENVIAR EMAILS${NC}                  ${BOLD}║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Comandos utiles:"
echo -e "  ${CYAN}cd ${APP_DIR} && php artisan migrate${NC}       Migrar BD"
echo -e "  ${CYAN}cd ${APP_DIR} && php artisan optimize${NC}      Optimizar"
echo -e "  ${CYAN}cd ${APP_DIR} && bash deploy/update.sh${NC}     Actualizar"
echo -e "  ${CYAN}cd ${APP_DIR} && bash deploy/backup.sh${NC}     Backup manual"
echo -e "  ${CYAN}systemctl status php8.3-fpm nginx${NC}          Estado servicios"
echo ""
