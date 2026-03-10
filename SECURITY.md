# Política de seguridad

## Versiones soportadas

| Versión | Soportada |
|---------|-----------|
| 1.0.x   | ✅         |

## Reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en OpenPapers, por favor
**no abras un issue público**. En su lugar:

1. Envía un email a **security@ttpsec.cl** con:
   - Descripción de la vulnerabilidad.
   - Pasos para reproducirla.
   - Impacto potencial.
   - Sugerencia de corrección (si la tienes).

2. Recibirás una confirmación dentro de **48 horas**.

3. Trabajaremos en una solución y coordinaremos la divulgación contigo.

## Buenas prácticas de despliegue

- **Nunca** uses los valores por defecto de `.env.example` en producción.
- Genera secretos JWT con al menos 64 caracteres aleatorios:
  ```bash
  openssl rand -base64 48
  ```
- Usa HTTPS (TLS) en producción — configura certificados en Nginx.
- Restringe CORS a tu dominio (`CORS_ORIGIN`).
- Cambia las credenciales de administrador inmediatamente después del primer inicio.
- Mantén las dependencias actualizadas (`npm audit`, Dependabot).
- Respalda periódicamente el archivo de base de datos SQLite.

## Alcance

Esta política aplica al código fuente del repositorio OpenPapers y
a las imágenes Docker oficiales publicadas por TTPSEC SPA.

Agradecemos a quienes reporten vulnerabilidades de forma responsable.
