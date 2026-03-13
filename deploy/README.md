# Despliegue de OpenPapers

Guía para desplegar OpenPapers (Laravel 11 + MariaDB) en un VPS o hosting compartido.

## Opción 1: Hosting compartido (desde $3/mes)

### Requisitos
- PHP 8.2+ con extensiones: pdo_mysql, mbstring, openssl, tokenizer, curl, fileinfo
- MariaDB 10.5+ o MySQL 8.0+
- Acceso FTP o panel de archivos

### Pasos

1. **Subir archivos** — Sube todo el contenido del repositorio al `public_html` o directorio web. El directorio `public/` debe ser la raíz web.

2. **Instalar dependencias** — Si tienes acceso SSH:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
   Si no tienes SSH, sube la carpeta `vendor/` desde tu máquina local.

3. **Ejecutar instalador** — Visita `https://tudominio.com/install.php` en el navegador. El instalador te pedirá:
   - Credenciales de MariaDB/MySQL
   - URL del sitio
   - Email y contraseña del administrador
   - Configuración SMTP (opcional)

4. **Eliminar install.php** — Por seguridad, elimina `public/install.php` después de instalar.

### Configurar raíz web

Si tu hosting apunta a `public_html/` pero Laravel necesita que `public/` sea la raíz:

**Opción A:** Configura el dominio para que apunte a `public_html/public/`

**Opción B:** Sube los archivos de Laravel fuera de `public_html/` y solo el contenido de `public/` dentro:
```
/home/usuario/
├── openpapers/          ← archivos Laravel (app/, config/, etc.)
│   └── public/          ← el contenido va en public_html
└── public_html/         ← apunta aquí → symlink o copia de public/
```

---

## Opción 2: VPS con script automatizado

### Requisitos
- Ubuntu 22.04/24.04 LTS
- Mínimo 1 GB RAM / 1 vCPU
- Dominio con DNS tipo A apuntando a la IP del VPS

### Inicio rápido

```bash
ssh root@IP_DEL_VPS
curl -fsSL https://raw.githubusercontent.com/ttpsecspa/openpapers/main/deploy/setup.sh -o setup.sh
sudo bash setup.sh --domain cfp.tudominio.cl --email admin@tudominio.cl
```

El script instala PHP 8.3, MariaDB, Nginx, Composer, Let's Encrypt SSL, y configura todo automáticamente.

### Estructura en el servidor

```
/var/www/openpapers/
├── app/                    # Controladores, modelos, middleware
├── config/                 # Configuración Laravel
├── database/               # Migraciones y seeders
├── public/                 # Raíz web (index.php)
├── resources/views/        # Blade templates
├── routes/                 # Rutas API y web
├── storage/
│   ├── app/submissions/    # PDFs subidos
│   ├── backups/            # Backups diarios
│   └── logs/               # Logs de Laravel
├── .env                    # Variables de entorno (secretos)
└── deploy/                 # Scripts de despliegue
```

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Actualizar | `cd /var/www/openpapers && sudo bash deploy/update.sh` |
| Backup manual | `cd /var/www/openpapers && sudo bash deploy/backup.sh` |
| Migrar BD | `cd /var/www/openpapers && php artisan migrate --force` |
| Limpiar cachés | `cd /var/www/openpapers && php artisan optimize:clear` |
| Modo mantenimiento | `php artisan down` / `php artisan up` |
| Ver logs | `tail -f /var/www/openpapers/storage/logs/laravel.log` |
| Estado servicios | `systemctl status php8.3-fpm nginx mariadb` |

## Backups

- **Automáticos:** Cada día a las 3:00 AM vía cron
- **Ubicación:** `storage/backups/`
- **Retención:** 7 días
- **Incluye:** Dump de MariaDB + archivos de submissions

### Restaurar un backup

```bash
cd /var/www/openpapers
gunzip storage/backups/openpapers_20260310_030000.sql.gz
mysql -u openpapers -p openpapers < storage/backups/openpapers_20260310_030000.sql
```

## SSL (HTTPS)

- **Certificado:** Let's Encrypt (gratuito, solo en VPS)
- **Renovación:** Automática cada lunes a las 4:00 AM
- **Verificar:** `certbot certificates`

## Escalar

| Escenario | Recomendación |
|-----------|---------------|
| < 500 submissions | Hosting compartido ($3-5/mes) |
| 500 – 2000 submissions | VPS 1 GB RAM ($6/mes) |
| > 2000 submissions | VPS 2+ GB RAM ($12+/mes) |

## Troubleshooting

### Error 500
```bash
tail -50 /var/www/openpapers/storage/logs/laravel.log
```

### Permisos de storage
```bash
chown -R www-data:www-data /var/www/openpapers/storage
chmod -R 775 /var/www/openpapers/storage
```

### PHP-FPM no responde
```bash
systemctl restart php8.3-fpm
systemctl status php8.3-fpm
```
