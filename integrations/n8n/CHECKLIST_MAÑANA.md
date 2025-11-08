# ✅ Checklist para Mañana - Implementación n8n + BIND

**Fecha objetivo:** 2025-11-03
**Tiempo estimado:** 2-3 horas

---

## 📋 Pre-requisitos (Recopilar ANTES de empezar)

Tener a mano estos datos:

- [ ] **Supabase Database Password**
  - Dónde: Supabase Dashboard → Settings → Database → Password
  - Formato: String largo

- [ ] **BIND API URL**
  - Ejemplo: `https://api.bind-erp.com`
  - Sin `/` al final

- [ ] **BIND API Token**
  - Dónde: Panel de BIND → API Keys
  - Formato: `eyJhbG...` (largo)

- [ ] **BIND ClientID** para "Soluciones a la Orden"
  - Ejemplo: `CLI-SOL-001`

- [ ] **BIND WarehouseID** (almacén principal)
  - Ejemplo: `ALM-PRINCIPAL`

- [ ] **BIND BranchID/LocationID**
  - Ejemplo: `SUC-NORTE`

- [ ] **BIND PriceListID**
  - Ejemplo: `LISTA-01`

- [ ] **BIND ProductIDs** (al menos 2-3 productos de prueba)
  - Producto 1: Nombre + ProductID
  - Producto 2: Nombre + ProductID
  - Producto 3: Nombre + ProductID

---

## 🏗️ Fase 1: Infraestructura Supabase (1 hora)

### Step 1.1: Crear Trigger de Encolado (15 min)

- [ ] Crear migration: `create_trigger_enqueue_for_bind.sql`
- [ ] Copiar SQL de: [GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md](../../GUIA_IMPLEMENTACION_BIND_PASO_A_PASO.md) → Paso 1.1
- [ ] Aplicar: `supabase db push`
- [ ] Verificar en Supabase SQL Editor:
  ```sql
  SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_enqueue_for_bind';
  ```
- [ ] Debe retornar 1 fila

### Step 1.2: Crear Tabla bind_mappings (20 min)

- [ ] Crear migration: `create_bind_mappings.sql`
- [ ] Copiar SQL de: Guía BIND → Paso 1.2
- [ ] Aplicar: `supabase db push`
- [ ] Verificar:
  ```sql
  \d bind_mappings
  ```

### Step 1.3: Insertar Mappings Iniciales (10 min)

- [ ] Crear migration: `seed_bind_mappings.sql`
- [ ] **IMPORTANTE:** Reemplazar valores de ejemplo con IDs reales de BIND
  - [ ] `CLI-SOLUCIONES-001` → `<ClientID real>`
  - [ ] `ALM-PRINCIPAL` → `<WarehouseID real>`
  - [ ] `Soluciones a la Orden` → `<Nombre exacto de empresa>`
- [ ] Aplicar migration
- [ ] Verificar:
  ```sql
  SELECT * FROM bind_mappings;
  ```
- [ ] Debe retornar al menos 2 registros

### Step 1.4: Crear Funciones Helper (15 min)

- [ ] Crear migration: `create_bind_helper_functions.sql`
- [ ] Copiar SQL de: Guía BIND → Paso 1.4
- [ ] Aplicar migration
- [ ] Probar funciones:
  ```sql
  SELECT get_bind_client_id((SELECT id FROM companies LIMIT 1));
  ```
- [ ] Debe retornar ClientID (ej: `CLI-SOL-001`)

---

## 🤖 Fase 2: Setup n8n (30 min)

### Step 2.1: Configurar Variables de Entorno (5 min)

- [ ] `cd integrations/n8n`
- [ ] `cp .env.example .env`
- [ ] Editar `.env` con valores reales
- [ ] Verificar que NO commitear `.env` (debe estar en `.gitignore`)

### Step 2.2: Iniciar n8n (2 min)

- [ ] `docker-compose up -d`
- [ ] Esperar mensaje: "Editor is now accessible"
- [ ] Verificar: `docker ps | grep n8n`
- [ ] Test: `curl http://localhost:5678/healthz`

### Step 2.3: Configurar Credenciales (10 min)

- [ ] Abrir: `http://localhost:5678`
- [ ] Login con `admin` / `<password-de-.env>`
- [ ] Crear credencial "Supabase Database"
  - [ ] Type: Postgres
  - [ ] Test Connection → ✅
- [ ] Crear credencial "BIND API Token"
  - [ ] Type: Header Auth
  - [ ] Header: `Authorization`
  - [ ] Value: `Bearer <token>`

### Step 2.4: Importar Workflow (10 min)

- [ ] Workflows → Import from File
- [ ] Seleccionar: `workflows/bind-create-order.json`
- [ ] Configurar credenciales en nodos
- [ ] Save Workflow
- [ ] **Activar workflow** (toggle verde)
- [ ] Ver Executions → Debe ejecutar cada 30s

---

## 🧪 Fase 3: Testing (30 min)

### Test 1: Conexiones (5 min)

- [ ] Test Supabase:
  ```sql
  SELECT NOW();
  ```
- [ ] Test BIND API (en nodo HTTP Request):
  ```
  GET {{ $env.BIND_API_URL }}/api/health
  ```

### Test 2: Mappings (5 min)

- [ ] Verificar que productos tienen `bind_id`:
  ```sql
  SELECT id, name, bind_id FROM products WHERE is_active = true;
  ```
- [ ] Si faltan, asignar manualmente:
  ```sql
  UPDATE products SET bind_id = 'PROD-XXX' WHERE id = '...';
  ```

### Test 3: End-to-End (15 min)

- [ ] Crear requisición de prueba en app
- [ ] Aprobar requisición
- [ ] Verificar que se encoló:
  ```sql
  SELECT * FROM pgmq.q_requisition_outbox_queue;
  ```
- [ ] Esperar 30 segundos
- [ ] Ver ejecución en n8n → Executions
- [ ] Verificar resultado:
  ```sql
  SELECT integration_status, bind_order_id FROM requisitions WHERE id = '...';
  ```
- [ ] Debe ser: `synced` con folio de BIND

### Test 4: Manejo de Errores (5 min)

- [ ] Aprobar requisición con producto sin `bind_id`
- [ ] Verificar que se rechaza automáticamente
- [ ] Revisar `bind_rejection_reason`

---

## 🔍 Fase 4: Monitoreo (15 min)

### Setup Dashboard (10 min)

- [ ] Crear query de health check:
  ```sql
  -- Guardar como "BIND Integration Health"
  SELECT
    CASE
      WHEN pending = 0 THEN 'GREEN'
      WHEN pending < 10 THEN 'YELLOW'
      ELSE 'RED'
    END as status,
    pending,
    synced_last_hour,
    rejected_last_hour
  FROM (
    SELECT
      COUNT(*) FILTER (WHERE integration_status = 'pending_sync') as pending,
      COUNT(*) FILTER (WHERE integration_status = 'synced' AND bind_synced_at > NOW() - INTERVAL '1 hour') as synced_last_hour,
      COUNT(*) FILTER (WHERE integration_status = 'rejected' AND updated_at > NOW() - INTERVAL '1 hour') as rejected_last_hour
    FROM requisitions
  ) sub;
  ```

### Alertas (5 min)

- [ ] Configurar alerta si `pending > 10`
- [ ] Configurar alerta si `rejected_last_hour > 5`

---

## 📊 Fase 5: Documentar (15 min)

### Checklist Final

- [ ] Tomar screenshots de:
  - [ ] Workflow activado en n8n
  - [ ] Ejecución exitosa
  - [ ] Orden creada en BIND
  - [ ] Requisición sincronizada en app

- [ ] Documentar en archivo: `IMPLEMENTACION_COMPLETADA.md`
  - [ ] Fecha de implementación
  - [ ] IDs reales de BIND usados
  - [ ] Productos mapeados
  - [ ] Problemas encontrados (si los hubo)
  - [ ] Tiempos de latencia observados

- [ ] Actualizar README principal con status: ✅ Implementado

---

## 🎉 Criterios de Éxito

Al finalizar, debes poder:

- ✅ Aprobar requisición en app web
- ✅ Orden se crea automáticamente en BIND (< 35 segundos)
- ✅ Usuario recibe notificación
- ✅ Folio de BIND aparece en app
- ✅ Dashboard muestra estado GREEN
- ✅ Errores se manejan correctamente (productos sin mapeo)

---

## 🆘 Si Algo Falla

1. **Ver logs de n8n:** `docker logs -f n8n`
2. **Ver estado de requisición:** Query en Supabase
3. **Ver cola PGMQ:** `SELECT * FROM pgmq.q_requisition_outbox_queue;`
4. **Consultar:** [docs/TROUBLESHOOTING_INTEGRACIONES.md](../../docs/TROUBLESHOOTING_INTEGRACIONES.md)

---

## 📞 Contactos

- Soporte BIND: __________________
- Supabase: https://supabase.com/support
- n8n Community: https://community.n8n.io

---

**Preparado por:** Claude Code
**Fecha:** 2025-11-02
**Listo para:** 2025-11-03

**¡Buena suerte mañana! 🚀**
