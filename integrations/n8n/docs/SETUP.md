# 🚀 Setup de n8n - Guía Completa

**Tiempo estimado:** 15-30 minutos
**Última actualización:** 2025-11-02

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

- [ ] Docker y Docker Compose instalados
- [ ] Credenciales de Supabase (host, user, password)
- [ ] Token de API de BIND ERP
- [ ] Puerto 5678 disponible

---

## 🎯 Opción 1: Docker (Recomendado)

### Paso 1: Preparar Variables de Entorno

```bash
# Ir a la carpeta de n8n
cd integrations/n8n

# Copiar template de variables
cp .env.example .env

# Editar con tus credenciales
nano .env
```

**Completar estos valores en `.env`:**

```bash
# Cambiar estos valores:
N8N_BASIC_AUTH_PASSWORD=tu-password-seguro-aqui  # Min 16 caracteres

SUPABASE_DB_HOST=db.azjaehrdzdfgrumbqmuc.supabase.co
SUPABASE_DB_PASSWORD=tu-password-de-supabase

BIND_API_URL=https://api.bind-erp.com  # URL real de BIND
BIND_API_TOKEN=tu-token-de-bind-aqui
```

### Paso 2: Iniciar n8n

```bash
# Iniciar en modo detached
docker-compose up -d

# Ver logs
docker-compose logs -f

# Esperar a ver:
# "Editor is now accessible via: http://localhost:5678"
```

### Paso 3: Verificar Instalación

```bash
# Verificar que n8n está corriendo
docker ps | grep n8n

# Debería mostrar:
# CONTAINER ID   IMAGE            STATUS
# abc123...      n8nio/n8n:latest Up 30 seconds

# Test de health
curl http://localhost:5678/healthz

# Debería retornar: { "status": "ok" }
```

### Paso 4: Acceder a n8n

```bash
# Abrir en navegador
open http://localhost:5678

# O manualmente:
# http://localhost:5678
```

**Credenciales de acceso:**
- Usuario: `admin` (definido en .env)
- Password: `<tu-password-de-.env>`

---

## 🎯 Opción 2: n8n Cloud

### Ventajas
- ✅ Sin instalar nada
- ✅ Backup automático
- ✅ Actualizaciones automáticas
- ✅ Plan gratuito: 5000 ejecuciones/mes

### Desventajas
- ❌ Latencia ligeramente mayor
- ❌ No permite acceso a `localhost` (Supabase debe ser público)

### Paso 1: Crear Cuenta

1. Ir a https://n8n.cloud
2. Sign Up (gratis)
3. Verificar email

### Paso 2: Importar Workflows

1. En n8n Cloud dashboard
2. Workflows → Import from File
3. Seleccionar `workflows/bind-create-order.json`
4. Configurar credenciales (ver abajo)

---

## 🔑 Configurar Credenciales

### Credencial 1: Supabase Database

1. En n8n UI: **Credentials** → **New** → buscar "Postgres"
2. Llenar datos:

```yaml
Name: Supabase Database
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres
Password: <ver en .env>
Port: 5432
SSL Mode: allow  # ← Importante para Supabase
```

3. Click **Test Connection**
   - ✅ Debería decir "Connection successful"
   - ❌ Si falla, verificar:
     - Host correcto (sin https://)
     - Password correcto
     - SSL = `allow` o `require`

4. **Save**

### Credencial 2: BIND API Token

1. En n8n UI: **Credentials** → **New** → buscar "Header Auth"
2. Llenar datos:

```yaml
Name: BIND API Token
Header Name: Authorization
Header Value: Bearer <tu-token-de-bind>
```

**IMPORTANTE:** Incluir "Bearer " antes del token

3. **Save** (no hay test para Header Auth)

---

## 📦 Importar Workflows

### Workflow: bind-create-order

1. En n8n UI: **Workflows** → **Add Workflow** → **Import from File**
2. Seleccionar: `workflows/bind-create-order.json`
3. Click **Import**

**El workflow aparecerá con algunos nodos en rojo (credenciales faltantes)**

4. Click en cada nodo rojo:
   - Nodos Postgres → Seleccionar "Supabase Database"
   - Nodo HTTP Request → Seleccionar "BIND API Token"

5. **Save Workflow**

6. **Activar workflow:**
   - Toggle switch en esquina superior derecha
   - Debe cambiar a verde

7. **Verificar ejecuciones:**
   - Ir a **Executions** tab
   - Debería aparecer una ejecución cada 30 segundos
   - Si no hay mensajes en cola, verá "No Data"

---

## ✅ Verificación Completa

### Test 1: Conexión a Supabase

```bash
# En n8n, crear workflow temporal de test:
# 1. Agregar nodo Postgres
# 2. Seleccionar credencial "Supabase Database"
# 3. Operation: Execute Query
# 4. Query:
SELECT NOW() as current_time, current_database() as db_name;

# 5. Execute Node
# 6. Debería retornar:
# {
#   "current_time": "2025-11-02T10:30:00Z",
#   "db_name": "postgres"
# }
```

### Test 2: BIND API

```bash
# En n8n, crear nodo HTTP Request:
# 1. Method: GET
# 2. URL: {{ $env.BIND_API_URL }}/api/health
# 3. Authentication: "BIND API Token"
# 4. Execute Node

# Debería retornar status 200 con:
# { "status": "ok" }

# Si retorna 401:
# - Token inválido
# Si retorna 404:
# - URL incorrecta
```

### Test 3: PGMQ Queue

```sql
-- En nodo Postgres de n8n
SELECT COUNT(*) as total_messages
FROM pgmq.q_requisition_outbox_queue;

-- Debería retornar número (puede ser 0)
```

### Test 4: Workflow End-to-End

```sql
-- 1. Crear requisición de prueba en Supabase
UPDATE requisitions
SET integration_status = 'pending_sync'
WHERE id = '<una-requisicion-real>';

-- 2. Esperar 30 segundos

-- 3. Ir a n8n → Executions
-- Debería ver nueva ejecución con datos procesados

-- 4. Verificar en Supabase
SELECT
  integration_status,
  bind_order_id,
  bind_synced_at
FROM requisitions
WHERE id = '<la-misma-requisicion>';

-- Esperado:
-- integration_status: 'synced' (o 'rejected' si hubo error)
-- bind_order_id: 'PO-2025-XXXX' (folio de BIND)
-- bind_synced_at: <timestamp reciente>
```

---

## 🐛 Troubleshooting

### Problema 1: n8n no inicia

```bash
# Ver logs de error
docker-compose logs

# Errores comunes:
# - Puerto 5678 ocupado → cambiar N8N_PORT en .env
# - Volumen no monta → docker-compose down -v && docker-compose up -d
```

### Problema 2: No puede conectar a Supabase

```bash
# Test de conexión manual
docker exec -it n8n sh
apk add postgresql-client
psql -h db.azjaehrdzdfgrumbqmuc.supabase.co -U postgres -d postgres

# Si falla:
# - Verificar host (debe ser db.XXXXX.supabase.co)
# - Verificar password
# - Verificar que IP de servidor está whitelisted en Supabase
```

### Problema 3: Workflow no ejecuta

**Verificar:**
- [ ] Workflow está **activado** (toggle verde)
- [ ] Schedule Trigger tiene cron correcto: `*/30 * * * * *`
- [ ] No hay errores en nodos (íconos rojos)
- [ ] Ver **Executions** tab para errores

### Problema 4: Error 401 en BIND API

```bash
# Verificar token
echo $BIND_API_TOKEN

# Regenerar en BIND si es necesario
# Actualizar en n8n: Credentials → BIND API Token → Edit
```

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
docker logs -f n8n

# Reiniciar n8n
docker restart n8n

# Detener n8n
docker-compose down

# Iniciar n8n
docker-compose up -d

# Entrar al contenedor
docker exec -it n8n sh

# Backup de datos n8n
docker cp n8n:/home/node/.n8n ./backup-n8n-$(date +%Y%m%d)

# Limpiar todo y empezar de cero
docker-compose down -v
rm -rf ~/.n8n  # Solo si usas volumen local
docker-compose up -d
```

---

## 📊 Monitoreo

### Health Check Automático

```bash
# Agregar a cron (cada 5 minutos)
*/5 * * * * curl -f http://localhost:5678/healthz || docker restart n8n
```

### Logs

```bash
# Ver últimas 100 líneas
docker logs n8n --tail 100

# Filtrar por workflow
docker logs n8n 2>&1 | grep "bind-create-order"

# Ver solo errores
docker logs n8n 2>&1 | grep -i "error"
```

---

## 🔄 Actualizar n8n

```bash
# Detener n8n
docker-compose down

# Descargar última versión
docker-compose pull

# Iniciar con nueva versión
docker-compose up -d

# Verificar versión
docker exec -it n8n n8n --version
```

---

## 📚 Próximos Pasos

1. ✅ n8n instalado y corriendo
2. ✅ Credenciales configuradas
3. ✅ Workflow importado y activado
4. → Probar con requisición real
5. → Configurar monitoreo
6. → Implementar más workflows

---

## 🔗 Referencias

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [n8n Docker Guide](https://docs.n8n.io/hosting/installation/docker/)
- [n8n Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/)
- [Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

**Setup completado por:** _______________________
**Fecha:** _______________________
**Notas adicionales:**
-
-
-
