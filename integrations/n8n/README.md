# 🤖 n8n - Orquestador de Integraciones

**Proyecto:** ComerECO Web Application
**Fecha:** 2025-11-02
**Versión:** 1.0

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Quick Start](#quick-start)
4. [Workflows Disponibles](#workflows-disponibles)
5. [Configuración](#configuración)
6. [Desarrollo](#desarrollo)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

Esta carpeta contiene todos los workflows de n8n que orquestan las integraciones con sistemas externos (BIND ERP, WhatsApp, Email, etc).

### ¿Qué es n8n?

n8n es una herramienta de automatización de workflows que nos permite:
- ✅ Llamar APIs externas de forma visual
- ✅ Manejar errores y reintentos automáticamente
- ✅ Debuggear con logs visuales
- ✅ Cambiar lógica sin tocar código de backend

### Arquitectura

```
┌───────────────────┐
│    Supabase DB    │
│   (PGMQ Queue)    │
└─────────┬─────────┘
          │
          ↓ (mensajes)
┌───────────────────┐
│       n8n         │
│   (Este folder)   │
└─────────┬─────────┘
          │
          ↓ (HTTP)
┌───────────────────┐
│   BIND ERP API    │
│  WhatsApp, etc    │
└───────────────────┘
```

---

## 📁 Estructura de Carpetas

```
integrations/n8n/
├── README.md                          # Este archivo
├── docker-compose.yml                 # Configuración de Docker
├── .env.example                       # Variables de entorno (template)
├── .env                               # Variables reales (NO commitear)
│
├── workflows/                         # Workflows de n8n (JSON)
│   ├── bind-create-order.json         # Crear orden en BIND
│   ├── bind-sync-products.json        # Sincronizar productos desde BIND
│   └── README.md                      # Documentación de workflows
│
├── api-docs/                          # 📚 Documentación de API BIND
│   ├── README.md                      # Índice de documentación
│   ├── endpoints/                     # Documentación de endpoints
│   ├── examples/                      # Ejemplos de requests/responses
│   ├── schemas/                       # JSON schemas
│   ├── screenshots/                   # Capturas de pantalla
│   └── postman/                       # Colecciones Postman
│
├── credentials/                       # Templates de credenciales
│   ├── supabase-postgres.template.json
│   ├── bind-api.template.json
│   └── README.md
│
├── docs/                              # Documentación adicional
│   ├── SETUP.md                       # Guía de instalación
│   ├── WORKFLOWS_GUIDE.md             # Guía de workflows
│   └── TROUBLESHOOTING.md             # Solución de problemas
│
└── scripts/                           # Scripts útiles
    ├── export-workflows.sh            # Exportar workflows desde n8n
    ├── import-workflows.sh            # Importar workflows a n8n
    └── backup.sh                      # Backup de configuración
```

---

## 🚀 Quick Start

### Opción 1: Docker (Recomendado)

```bash
# 1. Ir a la carpeta
cd integrations/n8n

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env con tus credenciales
nano .env

# 4. Iniciar n8n
docker-compose up -d

# 5. Abrir n8n en el navegador
open http://localhost:5678
```

### Opción 2: n8n Cloud

1. Ir a https://n8n.cloud
2. Crear cuenta (plan gratuito: 5000 ejecuciones/mes)
3. Importar workflows desde `workflows/`

---

## 📦 Workflows Disponibles

### 1. bind-create-order (Crítico)

**Archivo:** `workflows/bind-create-order.json`

**Qué hace:**
- Lee cola PGMQ cada 30 segundos
- Crea orden de compra en BIND ERP
- Actualiza estado en Supabase
- Notifica al usuario

**Trigger:** Cron (cada 30 segundos)
**Tiempo estimado:** 2-5 segundos por orden
**Estado:** ✅ Listo para implementar

---

### 2. bind-sync-products (Opcional)

**Archivo:** `workflows/bind-sync-products.json`

**Qué hace:**
- Sincroniza catálogo de productos desde BIND
- Actualiza precios y stock
- Marca productos descontinuados

**Trigger:** Cron (diario a las 2 AM)
**Tiempo estimado:** 5-10 minutos
**Estado:** 🟡 Pendiente de implementar

---

## ⚙️ Configuración

### Variables de Entorno

Editar `.env` con estos valores:

```bash
# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=tu-password-seguro-aqui
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
GENERIC_TIMEZONE=America/Mexico_City

# Supabase Database
SUPABASE_DB_HOST=db.azjaehrdzdfgrumbqmuc.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<SUPABASE_DB_PASSWORD>

# BIND ERP API
BIND_API_URL=https://api.bind-erp.com
BIND_API_TOKEN=tu-token-de-bind-aqui

# Opcionales
WEBHOOK_URL=https://tu-dominio.com/webhook
```

### Credenciales en n8n

Una vez que n8n esté corriendo:

1. **Ir a:** Credentials → New
2. **Crear credenciales:**

#### Postgres (Supabase)
```yaml
Type: Postgres
Name: Supabase Database
Host: ${SUPABASE_DB_HOST}
Database: ${SUPABASE_DB_NAME}
User: ${SUPABASE_DB_USER}
Password: ${SUPABASE_DB_PASSWORD}
Port: 5432
SSL: allow
```

#### HTTP (BIND API)
```yaml
Type: Header Auth
Name: BIND API Token
Name: Authorization
Value: Bearer ${BIND_API_TOKEN}
```

---

## 👨‍💻 Desarrollo

### Crear Nuevo Workflow

1. **En n8n UI:**
   - Workflows → New Workflow
   - Diseñar visualmente
   - Guardar con nombre descriptivo

2. **Exportar a este repo:**
   ```bash
   # Desde n8n UI: Workflows → [...] → Download
   # Mover archivo a workflows/
   mv ~/Downloads/My_Workflow.json workflows/mi-nuevo-workflow.json
   ```

3. **Documentar en `workflows/README.md`**

### Testing de Workflows

```javascript
// 1. Agregar nodo "Function" para testing
const testData = {
  requisition_id: 'test-uuid-123',
  company_bind_client_id: 'CLI-TEST',
  items: [
    {
      product_bind_id: 'PROD-TEST',
      quantity: 1,
      unit_price: 10.00
    }
  ]
};

return testData;

// 2. Ejecutar workflow: "Execute Workflow"
// 3. Ver resultado en cada nodo
```

### Debugging

```bash
# Ver logs en tiempo real
docker logs -f n8n

# Ver últimas 100 líneas
docker logs n8n --tail 100

# Filtrar por workflow
docker logs n8n 2>&1 | grep "bind-create-order"
```

---

## 🔧 Comandos Útiles

```bash
# Iniciar n8n
docker-compose up -d

# Detener n8n
docker-compose down

# Reiniciar n8n
docker-compose restart

# Ver logs
docker-compose logs -f

# Entrar al contenedor
docker exec -it n8n sh

# Backup completo
./scripts/backup.sh

# Exportar workflows
./scripts/export-workflows.sh

# Importar workflows
./scripts/import-workflows.sh
```

---

## 🆘 Troubleshooting

### n8n no inicia

```bash
# Ver logs de error
docker-compose logs

# Verificar puertos
lsof -i :5678

# Reiniciar completamente
docker-compose down -v
docker-compose up -d
```

### No puedo conectar a Supabase

```bash
# Test de conexión
docker exec -it n8n sh
apk add postgresql-client
psql -h db.azjaehrdzdfgrumbqmuc.supabase.co -U postgres -d postgres

# Verificar SSL
# Debe ser "allow" o "require" para Supabase
```

### Workflow no ejecuta

1. Verificar que workflow está **activado** (toggle verde)
2. Ver última ejecución en "Executions" tab
3. Revisar Schedule Trigger (cron expression)
4. Ver logs: `docker logs n8n --tail 50`

---

## 📚 Documentación Adicional

### n8n y Workflows
- [Setup Completo](./docs/SETUP.md)
- [Guía de Workflows](./docs/WORKFLOWS_GUIDE.md)
- [Troubleshooting Detallado](./docs/TROUBLESHOOTING.md)

### API de BIND ERP
- [📚 Documentación API BIND](./api-docs/README.md) - Documentación completa de API
- [BIND_API_MAP.md](./workflows/BIND_API_MAP.md) - Referencia rápida de endpoints
- [RESUMEN_BIND_REAL.md](./RESUMEN_BIND_REAL.md) - IDs reales y configuración

### Arquitectura General
- [Arquitectura Híbrida](../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md)

---

## 🔗 Enlaces Útiles

- [n8n Docs Oficiales](https://docs.n8n.io)
- [n8n Community Forum](https://community.n8n.io)
- [PGMQ PostgreSQL Queue](https://github.com/tembo-io/pgmq)
- [Supabase Docs](https://supabase.com/docs)

---

**Creado:** 2025-11-02
**Mantenido por:** Equipo de Desarrollo ComerECO
**Próxima revisión:** 2025-12-02
