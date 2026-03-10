# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-03-09

### Agregado

- **Multi-conferencia**: gestión de múltiples conferencias con tracks temáticos.
- **Envío de papers**: formulario público con subida de PDF y código de seguimiento.
- **Revisión por pares**: asignación de revisores, detección de conflicto de interés, doble ciego.
- **Dashboard**: panel de administración con estadísticas, gestión de usuarios y configuración SMTP.
- **Seguimiento público**: consulta de estado de envíos por código de seguimiento.
- **Notificaciones por email**: confirmación de envío, asignación de revisión, decisión (aceptación / rechazo / revisión).
- **Roles y permisos**: superadmin, admin (chair), reviewer, author.
- **Validación**: esquemas Zod en todas las rutas de API.
- **Autenticación JWT**: access tokens (15 min) + refresh tokens (7 días) con bcrypt.
- **Subida de archivos**: Multer con filtro PDF, nombres aleatorios con crypto.
- **Despliegue Docker**: docker-compose con backend, frontend Nginx y reverse proxy.
- **CI/CD**: GitHub Actions con matrix multi-OS (Ubuntu + Windows) y Node 20/22.
- **Documentación**: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, LICENSE (MIT).
- **Assets**: banner SVG, logo SVG, diagrama de arquitectura.
