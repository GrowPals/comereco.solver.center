# 🤖 Scripts de Automatización - COMERECO

Sistema completo de automatización y mantenimiento para COMERECO WebApp.

## 📋 Contenido

- [Scripts Disponibles](#-scripts-disponibles)
- [Configuración Cron](#-configuración-cron)
- [Scripts SQL](#-scripts-sql)
- [Uso](#-uso)
- [Troubleshooting](#-troubleshooting)

## 🛠️ Scripts Disponibles

### 1. cleanup-logs.sh
**Propósito:** Limpieza automática de logs antiguos

**Ejecutar:**
```bash
npm run cleanup:logs
```

**Flags:**
- `--days N`: Mantener logs de últimos N días (default: 30)
- `--dry-run`: Ver qué se eliminaría sin hacerlo
- `--verbose`: Mostrar detalles

**Ejemplo:**
```bash
./scripts/cleanup-logs.sh --days 15 --dry-run
```

**Limpia:**
- Logs de migración (migration_*.log)
- Logs de Vite
- Logs de npm/yarn
- Cache de Supabase
- Archivos comprimidos antiguos

### 2. maintenance.sh
**Propósito:** Mantenimiento periódico completo del sistema

**Ejecutar:**
```bash
npm run maintenance
```

**Tareas que ejecuta:**
1. Limpieza de logs antiguos
2. Limpieza de cache de node_modules
3. Limpieza de build artifacts
4. Verificación de dependencias npm
5. Auditoría de seguridad
6. Verificación de espacio en disco
7. Backup de .env (rotación)
8. Health check del sistema
9. Optimización de Git
10. Reporte de tamaños

**Notificaciones:**
- Slack (configurar SLACK_WEBHOOK_URL)
- Email (configurar MAINTENANCE_EMAIL)

**Log:** `maintenance-data/logs/maintenance_TIMESTAMP.log`

### 3. deploy.sh
**Propósito:** Deploy automatizado a producción

**Ejecutar:**
```bash
npm run deploy
```

**Pre-checks:**
1. ✅ Git limpio (sin cambios sin commitear)
2. ✅ Branch correcta (main/master)
3. ✅ Tests pasan (npm run test:rls)
4. ✅ Build exitoso
5. ✅ Deploy a Vercel

**Interactivo:** Pide confirmación si no estás en main/master

### 4. backup-db.sh
**Propósito:** Backup de base de datos Supabase

**Ejecutar:**
```bash
npm run backup:db
```

**Requisitos:**
- Supabase CLI instalado (`npm install -g supabase`)
- Variables en .env (VITE_SUPABASE_URL)

**Features:**
- Compresión automática (.gz)
- Retención de 7 días
- Backups en `backups/database/`

### 5. check-health.sh
**Propósito:** Verificación de salud del sistema

**Ejecutar:**
```bash
npm run health
```

**Verifica:**
- ✅ Variables de entorno
- ✅ Dependencias (Node, npm, Vercel CLI, Supabase CLI)
- ✅ Build (dist/)
- ✅ Git (branch, estado)
- ✅ Conectividad a Supabase
- ✅ Espacio en disco

**Exit codes:**
- `0`: Sistema saludable
- `1`: Sistema con errores críticos

## ⏰ Configuración Cron

### Instalación

1. **Editar crontab:**
```bash
crontab -e
```

2. **Copiar configuración** desde [crontab.example](./crontab.example)

3. **Ajustar PROJECT_DIR** a tu ruta real

### Programación Recomendada

```cron
# Backup BD (diario 1:00 AM)
0 1 * * * cd /path/to/project && npm run backup:db

# Health Check (cada 6 horas)
0 */6 * * * cd /path/to/project && npm run health

# Limpieza Logs (domingos 2:00 AM)
0 2 * * 0 cd /path/to/project && npm run cleanup:logs

# Mantenimiento (lunes 3:00 AM)
0 3 * * 1 cd /path/to/project && npm run maintenance
```

### Verificar Cron Activo

```bash
# Ver crontab instalado
crontab -l

# Ver logs del sistema
tail -f /var/log/syslog | grep CRON

# Ver logs de scripts
tail -f maintenance-data/logs/*.log
```

## 🗄️ Scripts SQL

### optimize-indexes.sql

**Ubicación:** `scripts/sql/optimize-indexes.sql`

**Propósito:** Optimización mensual de índices de BD

**Ejecutar:** Supabase SQL Editor (manualmente)

**Features:**
1. Análisis de índices no utilizados
2. Detección de índices duplicados
3. REINDEX de tablas críticas
4. VACUUM y ANALYZE
5. Creación de índices recomendados
6. Limpieza de datos antiguos
7. Estadísticas de tablas

**Frecuencia:** Mensual (1er día del mes)

### cleanup-data.sql

**Ubicación:** `scripts/sql/cleanup-data.sql`

**Propósito:** Limpieza de datos antiguos en Supabase

**Ejecutar:** Supabase SQL Editor (manualmente)

**Limpia:**
- audit_log (>90 días)
- notifications leídas (>30 días)
- sessions expiradas
- cart_items abandonados (>7 días)
- requisitions en draft (>30 días)

**Frecuencia:** Mensual

## 🚀 Uso

### Comandos npm

```bash
# Limpieza de logs
npm run cleanup:logs

# Mantenimiento completo
npm run maintenance

# Deploy a producción
npm run deploy

# Backup de BD
npm run backup:db

# Health check
npm run health
```

### Uso Manual

```bash
# Dry-run de limpieza
./scripts/cleanup-logs.sh --dry-run --verbose

# Mantenimiento forzado
./scripts/maintenance.sh

# Health check silencioso
./scripts/check-health.sh > /dev/null && echo "OK" || echo "ERROR"
```

## 🔧 Configuración

### Variables de Entorno

```bash
# .env (requerido)
VITE_SUPABASE_URL=https://....supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...

# Opcionales (para notificaciones)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
MAINTENANCE_EMAIL=admin@tu-dominio.com
```

### Permisos

```bash
# Hacer scripts ejecutables
chmod +x scripts/*.sh
```

## 📊 Logs

### Ubicaciones

```
maintenance-data/logs/
├── maintenance_TIMESTAMP.log      # Logs de mantenimiento
├── backup_cron.log                # Logs de backup cron
├── health_cron.log                # Logs de health cron
├── cleanup_cron.log               # Logs de limpieza cron
└── maintenance_cron.log           # Logs de maintenance cron

migration-data/03-logs/
└── migration_TIMESTAMP.log        # Logs de migración
```

### Rotación Automática

- Logs de migración: 30 días
- Logs de mantenimiento: Rotación manual
- Logs de cron: Monitorear manualmente

## 🐛 Troubleshooting

### Error: "Permission denied"

```bash
chmod +x scripts/*.sh
```

### Error: "Supabase CLI not found"

```bash
npm install -g supabase
```

### Error: "No space left on device"

```bash
# Ver espacio
df -h

# Limpiar manualmente
npm run cleanup:logs
npm run maintenance
```

### Cron no ejecuta

```bash
# Verificar cron está activo
sudo systemctl status cron

# Ver logs de cron
tail -f /var/log/syslog | grep CRON

# Probar comando manualmente
cd /path/to/project && npm run maintenance
```

### Health check falla

```bash
# Ver detalles
npm run health

# Verificar conectividad
curl -I $VITE_SUPABASE_URL/rest/v1/
```

## 📈 Monitoring

### Dashboards Recomendados

1. **Supabase Dashboard**
   - Database health
   - Storage usage
   - API calls

2. **Vercel Dashboard**
   - Deployments
   - Performance
   - Logs

3. **Local Logs**
   - `tail -f maintenance-data/logs/*.log`

### Métricas Clave

- Espacio en disco: < 80%
- Audit logs: < 100K registros
- Backups: mínimo 3 disponibles
- Health checks: 100% success rate

## 🎯 Roadmap

### Futuras Mejoras

- [ ] GitHub Actions para CI/CD
- [ ] Monitoring dashboard web
- [ ] Alertas automáticas (PagerDuty/Opsgenie)
- [ ] Métricas en Grafana
- [ ] Tests automatizados pre-deploy
- [ ] Rollback automatizado

---

**Última actualización:** 2025-11-06
