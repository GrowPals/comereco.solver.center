# 🔄 n8n Workflows

Esta carpeta contiene todos los workflows de n8n exportados en formato JSON.

---

## 📦 Workflows Disponibles

### 🆕 WF-02: Requisition Sync to BIND ⭐⭐⭐ (Nuevo - Recomendado)

**Archivo:** `WF-02-Requisition-Sync-to-BIND.json`

**Descripción:**
Workflow completo y optimizado que sincroniza requisiciones aprobadas desde Supabase a BIND ERP. Incluye manejo completo de errores, retry automático, y logging detallado.

**Trigger:**
- Tipo: Schedule (Cron)
- Frecuencia: Cada 15 minutos
- Expresión: `*/15 * * * *`

**Características:**
- ✅ Transformación automática al formato de BIND
- ✅ Manejo de errores con retry (hasta 3 intentos)
- ✅ Logging completo en `bind_sync_logs`
- ✅ Actualización de estados en tiempo real
- ✅ Request IDs únicos para debugging
- ✅ Procesa hasta 10 requisiciones por ejecución

**Flujo:**
```
Schedule Trigger (cada 15 min)
    ↓
Query: Requisiciones Pendientes (approved + pending_sync)
    ↓
IF Has Requisitions? ─── No ──→ End
    ↓ Yes
Loop Each Requisition
    ↓
Transform to BIND Format (JavaScript)
    ↓
POST to BIND API
    ↓
Switch: Success or Error?
    ├─ Success → Update: synced → Log Success → Loop
    └─ Error   → Update: failed → Log Error   → Loop
```

**Credenciales requeridas:**
- ✅ `Supabase Production` (Postgres)
- ✅ `BIND ERP API` (HTTP Header Auth)

**Variables de entorno:**
- `BIND_API_URL` - URL base de BIND API

**Documentación:**
- 📖 [WF-02-README.md](./WF-02-README.md) - Documentación completa
- ⚡ [WF-02-CONFIGURACION-RAPIDA.md](./WF-02-CONFIGURACION-RAPIDA.md) - Setup en 5 minutos

**Estado:** ✅ **Listo para producción** - Importar y configurar

---

### 1. bind-create-order.json ⭐ (Legacy - Deprecado)

**Descripción:**
Workflow principal que crea órdenes de compra en BIND ERP cuando una requisición es aprobada.

**Trigger:**
- Tipo: Schedule (Cron)
- Frecuencia: Cada 30 segundos
- Expresión: `*/30 * * * * *`

**Flujo:**
```
Schedule Trigger (cada 30s)
    ↓
Read PGMQ Queue (leer hasta 10 mensajes)
    ↓
IF Has Messages? ─── No ──→ End
    ↓ Yes
Split In Batches (procesar de 1 en 1)
    ↓
Set Variables (extraer datos del mensaje)
    ↓
Build BIND Payload (construir JSON para BIND)
    ↓
HTTP - Call BIND API (POST /api/purchase-orders)
    ↓
IF Success? (status 200-299?)
    ├─ Yes: Update Success → Notify User → Delete Message → Loop
    └─ No:  Update Failed → Notify Admin → Delete Message → Loop
```

**Nodos:**
- **Schedule Trigger:** Ejecuta workflow cada 30 segundos
- **Read PGMQ Queue:** Lee cola `requisition_outbox_queue`
- **IF - Has Messages?:** Verifica si hay mensajes
- **Split In Batches:** Procesa mensajes uno por uno
- **Set Variables:** Extrae y normaliza datos del mensaje
- **Build BIND Payload:** Construye JSON según formato de BIND API
- **HTTP - Call BIND API:** Llamada POST a BIND
- **IF - Success?:** Bifurca según éxito/error
- **Update Requisition - Success:** Marca como `synced` en DB
- **Create Notification - Success:** Notifica al usuario
- **Delete Message - Success:** Elimina de cola PGMQ
- **Update Requisition - Failed:** Marca como `rejected` en DB
- **Create Notification - Failed:** Notifica al admin
- **Delete Message - Failed:** Elimina de cola PGMQ

**Credenciales requeridas:**
- ✅ Supabase Database (Postgres)
- ✅ BIND API Token (HTTP Header Auth)

**Variables de entorno usadas:**
- `BIND_API_URL`
- `BIND_API_TOKEN`

**Performance:**
- Latencia promedio: 2-5 segundos por orden
- Throughput: Hasta 20 órdenes por minuto
- Retry: 3 intentos con 2 segundos entre cada uno

**Estado:** ✅ Listo para producción

---

### 2. bind-sync-products.json (Futuro)

**Descripción:**
Sincroniza catálogo de productos desde BIND ERP a Supabase.

**Trigger:**
- Tipo: Schedule (Cron)
- Frecuencia: Diario a las 2 AM
- Expresión: `0 2 * * *`

**Flujo:**
```
Schedule Trigger (2 AM diario)
    ↓
Get Companies (SELECT * FROM companies WHERE active = true)
    ↓
Loop Over Companies
    ↓
HTTP - Get Products from BIND (GET /api/products)
    ↓
Loop Over Products
    ↓
Postgres - Upsert Product (CALL upsert_product_from_bind())
    ↓
Mark Deleted Products (UPDATE products SET is_active = false)
```

**Estado:** 🟡 Pendiente de implementación

---

## 📥 Cómo Importar Workflows

### Opción 1: Desde n8n UI

1. Abrir n8n: `http://localhost:5678`
2. Ir a: **Workflows** → **Add Workflow** → **Import from File**
3. Seleccionar archivo: `bind-create-order.json`
4. Click en **Import**
5. Configurar credenciales (ver abajo)
6. **Activar workflow** (toggle switch)

### Opción 2: Desde CLI (Avanzado)

```bash
# Copiar workflow al volumen de n8n
docker cp bind-create-order.json n8n:/home/node/.n8n/workflows/

# Reiniciar n8n
docker restart n8n
```

---

## 🔑 Configurar Credenciales

Después de importar, debes configurar las credenciales:

### 1. Supabase Database (Postgres)

```
Credentials → New → Postgres

Name: Supabase Database
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres
Password: <tu-password-de-supabase>
Port: 5432
SSL: allow
```

### 2. BIND API Token (HTTP Header Auth)

```
Credentials → New → Header Auth

Name: BIND API Token
Header Name: Authorization
Header Value: Bearer <tu-token-de-bind>
```

---

## 📤 Cómo Exportar Workflows

### Desde n8n UI

1. Abrir workflow
2. Click en **[...]** (menú)
3. **Download**
4. Guardar en esta carpeta (`workflows/`)
5. Renombrar a formato: `nombre-descriptivo.json`

### Script Automatizado

```bash
# Usar script de export (desde raíz de integrations/n8n)
./scripts/export-workflows.sh
```

---

## 🧪 Testing de Workflows

### Test Manual (Recomendado)

1. **Abrir workflow** en n8n
2. **Click en nodo "Set Variables"**
3. **Add Test Data:**
   ```json
   {
     "msg_id": 999,
     "read_ct": 1,
     "message": {
       "requisition_id": "test-uuid-123",
       "internal_folio": "TEST-001",
       "company_bind_client_id": "CLI-TEST",
       "company_bind_location_id": "SUC-TEST",
       "company_bind_warehouse_id": "ALM-TEST",
       "company_bind_price_list_id": "PRICE-TEST",
       "comments": "Pedido de prueba",
       "total_amount": 100.00,
       "items": [
         {
           "product_bind_id": "PROD-TEST",
           "product_name": "Producto de prueba",
           "quantity": 1,
           "unit_price": 100.00,
           "unit": "unidad"
         }
       ]
     }
   }
   ```
4. **Execute Node** (botón de play en el nodo)
5. **Verificar output** en cada nodo

### Test End-to-End

```sql
-- 1. Crear requisición de prueba en Supabase
UPDATE requisitions
SET integration_status = 'pending_sync'
WHERE id = '<requisition-id-de-prueba>';

-- 2. Esperar 30 segundos (workflow ejecuta)

-- 3. Verificar resultado
SELECT
  integration_status,
  bind_order_id,
  bind_synced_at
FROM requisitions
WHERE id = '<requisition-id-de-prueba>';

-- Esperado:
-- integration_status: 'synced'
-- bind_order_id: 'PO-2025-XXXX'
-- bind_synced_at: <timestamp reciente>
```

---

## 🐛 Debugging

### Ver Ejecuciones

1. En n8n UI: **Executions** tab
2. Click en ejecución
3. Ver input/output de cada nodo
4. Ver errores en nodos marcados con ❌

### Logs en Docker

```bash
# Ver logs en tiempo real
docker logs -f n8n

# Filtrar por workflow
docker logs n8n 2>&1 | grep "bind-create-order"

# Ver últimas 100 líneas
docker logs n8n --tail 100
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `credential not found` | Credenciales no configuradas | Configurar en Credentials → ... |
| `ECONNREFUSED` | No puede conectar a Supabase | Verificar host/port en credenciales |
| `404 Not Found` | URL de BIND incorrecta | Verificar `BIND_API_URL` en .env |
| `401 Unauthorized` | Token inválido | Regenerar token en BIND |
| `Timeout` | API tarda más de 30s | Aumentar timeout en nodo HTTP |

---

## 📊 Métricas

### Queries de Monitoreo

```sql
-- Ver workflows ejecutados en última hora
SELECT
  COUNT(*) as total_ejecutados,
  COUNT(*) FILTER (WHERE integration_status = 'synced') as exitosos,
  COUNT(*) FILTER (WHERE integration_status = 'rejected') as fallidos
FROM requisitions
WHERE bind_synced_at > NOW() - INTERVAL '1 hour'
   OR (integration_status = 'rejected' AND updated_at > NOW() - INTERVAL '1 hour');

-- Ver latencia promedio
SELECT
  AVG(EXTRACT(EPOCH FROM (bind_synced_at - approved_at))) as promedio_segundos
FROM requisitions
WHERE integration_status = 'synced'
  AND bind_synced_at > NOW() - INTERVAL '24 hours';
```

---

## 📚 Referencias

- [n8n Workflow Documentation](https://docs.n8n.io/workflows/)
- [Arquitectura Híbrida](../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md)
- [Best Practices](../../docs/BEST_PRACTICES_INTEGRACIONES.md)
- [Troubleshooting](../../docs/TROUBLESHOOTING_INTEGRACIONES.md)

---

**Última actualización:** 2025-11-02
