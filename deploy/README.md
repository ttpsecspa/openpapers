# Despliegue en DigitalOcean

Guía para desplegar OpenPapers en un Droplet de DigitalOcean con Docker Compose, SSL y backups automáticos.

## Prerrequisitos

1. **Cuenta de DigitalOcean** — [registrarse](https://www.digitalocean.com/)
2. **Dominio** con registro DNS tipo A apuntando a la IP del Droplet
3. **Droplet Ubuntu 24.04 LTS** — mínimo 1 GB RAM / 1 vCPU ($6/mes)

## Inicio rápido

### 1. Crear el Droplet

- **Imagen:** Ubuntu 24.04 LTS
- **Plan:** Basic, 1 GB RAM / 1 vCPU / 25 GB SSD ($6/mes) — suficiente para conferencias pequeñas/medianas
- **Región:** la más cercana a tus usuarios
- **Autenticación:** SSH key (recomendado)

### 2. Configurar DNS

Crea un registro DNS tipo A apuntando tu dominio a la IP del Droplet:

```
Tipo: A
Nombre: cfp (o @ para el dominio raíz)
Valor: IP_DEL_DROPLET
TTL: 3600
```

> **Importante:** El DNS debe estar propagado antes de ejecutar el script (necesario para Let's Encrypt).

### 3. Conectarse al Droplet

```bash
ssh root@IP_DEL_DROPLET
```

### 4. Ejecutar el script de instalación

```bash
curl -fsSL https://raw.githubusercontent.com/ttpsecspa/openpapers/main/deploy/setup.sh -o setup.sh
sudo bash setup.sh --domain cfp.tudominio.cl --email admin@tudominio.cl
```

Con SMTP configurado:

```bash
sudo bash setup.sh \
  --domain cfp.tudominio.cl \
  --email admin@tudominio.cl \
  --smtp-host smtp.gmail.com \
  --smtp-user cfp@tudominio.cl \
  --smtp-pass "tu_app_password"
```

### 5. ¡Listo!

El script mostrará la URL, email y contraseña de administrador al finalizar.

## Estructura en el servidor

```
/opt/openpapers/
├── data/
│   ├── openpapers.db          # Base de datos SQLite
│   ├── uploads/               # PDFs subidos
│   └── backups/               # Backups diarios (7 días)
├── backend/                   # Código del backend
├── frontend/                  # Código del frontend
├── nginx/default.conf         # Config Nginx con SSL
├── docker-compose.yml         # Docker Compose
├── .env                       # Variables de entorno (secretos)
└── deploy/                    # Scripts de despliegue
```

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Ver logs | `cd /opt/openpapers && docker compose logs -f` |
| Reiniciar | `cd /opt/openpapers && docker compose restart` |
| Actualizar | `cd /opt/openpapers && bash deploy/update.sh` |
| Backup manual | `cd /opt/openpapers && bash deploy/backup.sh` |
| Estado | `cd /opt/openpapers && docker compose ps` |
| Detener | `cd /opt/openpapers && docker compose down` |

## Backups

- **Automáticos:** Cada día a las 3:00 AM vía cron
- **Ubicación:** `/opt/openpapers/data/backups/`
- **Retención:** 7 días (los más antiguos se eliminan)
- **Formato:** `openpapers_YYYYMMDD_HHMMSS.db.gz`

### Restaurar un backup

```bash
cd /opt/openpapers
docker compose down
gunzip data/backups/openpapers_20260310_030000.db.gz
cp data/backups/openpapers_20260310_030000.db data/openpapers.db
docker compose up -d
```

## SSL (HTTPS)

- **Certificado:** Let's Encrypt (gratuito)
- **Renovación:** Automática cada lunes a las 4:00 AM
- **Verificar:** `certbot certificates`

Si el certificado no se obtuvo durante la instalación:

```bash
certbot certonly --standalone --domain cfp.tudominio.cl --email admin@tudominio.cl
cd /opt/openpapers && bash deploy/setup.sh --domain cfp.tudominio.cl --email admin@tudominio.cl
```

## Actualizar

```bash
cd /opt/openpapers && bash deploy/update.sh
```

El script:
1. Crea un backup antes de actualizar
2. Descarga los cambios de GitHub
3. Reconstruye los contenedores
4. Verifica que el servicio responda

## Escalar

| Escenario | Recomendación |
|-----------|---------------|
| < 500 submissions | 1 GB RAM / 1 vCPU ($6/mes) |
| 500 – 2000 submissions | 2 GB RAM / 1 vCPU ($12/mes) |
| > 2000 submissions | 4 GB RAM / 2 vCPU ($24/mes) |

## Troubleshooting

### El backend no arranca
```bash
docker compose logs backend
```

### Error de permisos en la base de datos
```bash
chown -R 1000:1000 /opt/openpapers/data
docker compose restart backend
```

### Certificado SSL no se renueva
```bash
certbot renew --dry-run
```

### Puerto 80/443 ocupado
```bash
ss -tlnp | grep -E ':80|:443'
# Detener el servicio que ocupa el puerto
```

### Reconstruir desde cero
```bash
cd /opt/openpapers
docker compose down -v
docker compose build --no-cache
docker compose up -d
```
