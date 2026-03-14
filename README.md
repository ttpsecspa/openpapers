# OpenPapers

**Sistema de gestión de conferencias académicas y revisión de artículos.**

Plataforma web para gestionar el ciclo completo de una conferencia académica: Call for Papers, recepción de artículos, asignación de revisores, proceso de revisión double-blind y notificación de decisiones.

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Backend | Laravel 11 (PHP 8.2+) |
| Base de datos | MariaDB / MySQL |
| Frontend | Blade + Alpine.js + Tailwind CSS |
| Autenticación | Session-based + Laravel Sanctum (API) |
| Email | SMTP configurable |

## Características

- **Call for Papers público** — Página pública por conferencia con tracks, fechas límite y formulario de envío
- **Envío de artículos** — Wizard de 4 pasos con upload de PDF, drag & drop, validación de tipo/tamaño
- **Tracking de estado** — Los autores rastrean su envío con código único sin crear cuenta
- **Revisión double-blind** — Los revisores no ven información del autor
- **Asignación automática** — Balanceo de carga por track, detección de conflictos autor-revisor
- **Dashboard multi-rol** — Superadmin, Admin, Reviewer, Author con vistas diferenciadas
- **Multi-conferencia** — Cada admin solo ve sus conferencias (CWE-863)
- **6 plantillas de email** — Confirmación, asignación, recordatorio, decisión (aceptado/rechazado/revisión)
- **Estadísticas** — Envíos por estado/track/fecha, distribución de scores, carga de revisores
- **Instalador web** — Wizard tipo WordPress que configura DB, .env y superadmin desde el navegador

## Seguridad (15 CWEs)

| CWE | Protección |
|---|---|
| CWE-89 | SQL Injection — Eloquent ORM con prepared statements |
| CWE-79 | XSS — Blade auto-escaping + Content-Security-Policy |
| CWE-352 | CSRF — Laravel CSRF tokens en todos los formularios |
| CWE-307 | Brute Force — Rate limiting: auth 20/15min, tracking 10/15min, API 300/15min |
| CWE-639 | IDOR — Verificación de ownership en cada endpoint |
| CWE-863 | Scope Auth — Admin solo ve conferencias propias, superadmin bypasses |
| CWE-915 | Mass Assignment — Whitelist explícito en Settings, `$fillable` en modelos |
| CWE-916 | Weak Hash — Bcrypt con 12 rounds |
| CWE-521 | Weak Password — Mínimo 8 chars, mayúscula, minúscula, número |
| CWE-200 | Info Leak — Errores genéricos en producción, reviews ocultos hasta decisión |
| CWE-770 | Resource Exhaustion — Rate limiting global 60/min, file size limits |
| CWE-116 | Output Encoding — Content-Disposition sanitizado, headers de seguridad |
| CWE-20 | Input Validation — FormRequest validation en todos los endpoints |
| CWE-22 | Path Traversal — `basename()` en descargas, storage aislado |
| CWE-434 | File Upload — Solo PDF, validación MIME + extensión, tamaño configurable |

### Headers de Seguridad

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Instalación

### Opción 1: Hosting Compartido (cPanel / Plesk)

1. Sube todos los archivos al hosting vía FTP o File Manager
2. Apunta el dominio a la carpeta `public/`
3. Visita `https://tudominio.com/install.php`
4. Completa el wizard: datos de DB, cuenta admin, SMTP (opcional)
5. **Elimina `install.php`** después de instalar

### Opción 2: VPS / Servidor Dedicado

```bash
sudo bash deploy/setup.sh --domain tudominio.com --email admin@tudominio.com
```

El script instala PHP 8.3, MariaDB, Nginx, Composer, SSL (Let's Encrypt), backups automáticos y firewall.

### Opción 3: Desarrollo Local

```bash
# Requisitos: PHP 8.2+, Composer, MariaDB/MySQL
composer install
cp .env.example .env
php artisan key:generate
# Editar .env con datos de tu DB local
php artisan migrate --seed
php artisan serve
```

## Estructura del Proyecto

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/          # 8 API controllers (Auth, Conferences, Reviews, etc.)
│   │   └── Web/          # 3 Web controllers (Auth, Public, Dashboard)
│   └── Middleware/
│       ├── CheckRole.php           # role:superadmin,admin
│       ├── CheckConferenceMember.php  # CWE-863 conference scoping
│       ├── CheckInstalled.php      # Redirect to installer
│       └── SecurityHeaders.php     # OWASP security headers
├── Models/               # 9 Eloquent models
├── Services/
│   ├── AutoAssignService.php  # Load-balanced reviewer assignment
│   └── MailerService.php      # Template-based email with logging
config/
├── openpapers.php        # App-specific config (roles, statuses, settings whitelist)
database/
├── migrations/           # 4 migration files (users, conferences, submissions, email_log)
resources/
├── views/
│   ├── layouts/          # app, public, dashboard
│   ├── public/           # home, cfp, submit, track, login
│   └── dashboard/        # overview, submissions, reviews, users, conferences, settings, etc.
├── templates/email/      # 6 HTML email templates
routes/
├── api.php               # 28 API endpoints with auth + rate limiting
├── web.php               # Public + dashboard web routes
deploy/
├── setup.sh              # VPS automated setup
├── update.sh             # Zero-downtime updates
├── backup.sh             # Daily DB + files backup
public/
├── install.php           # Web installer (WordPress-style)
```

## Roles de Usuario

| Rol | Permisos |
|---|---|
| **superadmin** | Todo: conferencias, usuarios, configuración global |
| **admin** | Gestión de sus conferencias: envíos, revisores, decisiones |
| **reviewer** | Ver asignaciones, enviar reviews (double-blind) |
| **author** | Enviar artículos, ver estado de sus envíos |

## API Endpoints

Todos los endpoints están bajo `/api/` con autenticación Sanctum y rate limiting.

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login (session + token) |
| POST | `/api/auth/register` | Registro con validación |
| GET | `/api/conferences` | Listar conferencias públicas |
| POST | `/api/submissions` | Enviar artículo (multipart/form-data) |
| POST | `/api/submissions/track` | Tracking por código |
| GET | `/api/dashboard/submissions` | Envíos (filtrado por rol) |
| POST | `/api/dashboard/reviews` | Enviar review |
| GET | `/api/dashboard/stats` | Estadísticas del dashboard |

*Ver `routes/api.php` para la lista completa de 28 endpoints.*

## Configuración (.env)

Variables clave en `.env`:

```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=openpapers
DB_USERNAME=openpapers_user
DB_PASSWORD=tu_contraseña_segura

# Superadmin inicial
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=ContraseñaSegura123
ADMIN_NAME=Administrador

# Email SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu@gmail.com
MAIL_PASSWORD=app_password
MAIL_FROM_ADDRESS=noreply@tudominio.com

# Límites
MAX_FILE_SIZE_MB=10
MIN_REVIEWERS=2
```

## Mantenimiento

```bash
# Actualizar
cd /var/www/openpapers && sudo bash deploy/update.sh

# Backup manual
sudo bash deploy/backup.sh

# Limpiar cache
php artisan config:clear && php artisan cache:clear && php artisan view:clear

# Ver logs
tail -f storage/logs/laravel.log
```

## Licencia

MIT
