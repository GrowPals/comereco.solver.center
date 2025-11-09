# ⚡ n8n - Quick Start (5 Minutos)

**Para empezar MAÑANA por la mañana.**

---

## 🚀 Inicio Rápido

### 1. Editar Variables de Entorno (2 min)

```bash
cd integrations/n8n
cp .env.example .env
nano .env
```

**Cambiar SOLO estos valores:**
```bash
N8N_BASIC_AUTH_PASSWORD=TU_PASSWORD_SEGURO  # Min 16 caracteres

SUPABASE_DB_PASSWORD=<SUPABASE_DB_PASSWORD>

BIND_API_URL=https://api.bind-erp.com  # URL real
BIND_API_TOKEN=TU_TOKEN_DE_BIND
```

Guardar y salir (Ctrl+X, Y, Enter)

---

### 2. Iniciar n8n (30 segundos)

```bash
docker-compose up -d
```

**Esperar a ver:**
```
✅ Container n8n  Started
```

---

### 3. Abrir n8n (10 segundos)

```bash
open http://localhost:5678
```

**Login:**
- Usuario: `admin`
- Password: `<tu-password-de-.env>`

---

### 4. Configurar Credenciales (2 min)

#### Credencial 1: Supabase

1. Credentials → New → Postgres
2. Name: `Supabase Database`
3. Llenar:
   - Host: `db.azjaehrdzdfgrumbqmuc.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: `<SUPABASE_DB_PASSWORD>`
   - Port: `5432`
   - SSL: `allow`
4. Test Connection → Save

#### Credencial 2: BIND

1. Credentials → New → Header Auth
2. Name: `BIND API Token`
3. Llenar:
   - Header Name: `Authorization`
   - Header Value: `Bearer <tu-token-de-bind>`
4. Save

---

### 5. Importar Workflow (30 segundos)

1. Workflows → Add Workflow → Import from File
2. Seleccionar: `workflows/bind-create-order.json`
3. Click **Import**
4. En cada nodo rojo, seleccionar credencial correspondiente
5. **Save Workflow**
6. **Activar** (toggle verde arriba a la derecha)

---

## ✅ Verificar que Funciona

### Test Rápido (1 min)

```sql
-- En Supabase SQL Editor:
UPDATE requisitions
SET integration_status = 'pending_sync'
WHERE id = '<una-requisicion-real>';

-- Esperar 30 segundos

-- Verificar:
SELECT
  integration_status,
  bind_order_id
FROM requisitions
WHERE id = '<la-misma-requisicion>';

-- Esperado:
-- integration_status: 'synced'
-- bind_order_id: 'PO-2025-XXXX'
```

**Si funciona:** ✅ Todo listo para producción

**Si falla:** Ver [docs/SETUP.md](./docs/SETUP.md) → Troubleshooting

---

## 🆘 Comandos Útiles

```bash
# Ver logs
docker logs -f n8n

# Reiniciar
docker restart n8n

# Detener
docker-compose down

# Backup
./scripts/backup.sh
```

---

## 📚 Documentación Completa

- [README.md](./README.md) - Visión general
- [docs/SETUP.md](./docs/SETUP.md) - Setup detallado
- [workflows/README.md](./workflows/README.md) - Workflows
- [../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md](../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md) - Arquitectura

---

**Tiempo total:** ~5 minutos

**¡Listo para empezar! 🎉**
