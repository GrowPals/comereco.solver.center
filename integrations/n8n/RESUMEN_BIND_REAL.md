# 🎯 RESUMEN: BIND ERP - Datos Reales Validados

**Fecha:** 2025-11-02
**Estado:** ✅ Ingeniería inversa completada
**Listo para:** Implementación production

---

## 🔑 Credenciales y Configuración

### API Token (REAL)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImFkbWlufDEyNDA5NiIsIkludGVybmFsSUQiOiJmNjQ5YWY1Ni03YWFmLTQyY2ItOTU5OS04ZmU5YjMxZjMwMTciLCJuYmYiOjE3NjE4MTIyMjQsImV4cCI6MTc5MzM0ODIyNCwiaWF0IjoxNzYxODEyMjI0LCJpc3MiOiJNaW5udF9Tb2x1dGlvbnNfU0FfREVfQ1YiLCJhdWQiOiJCaW5kX0VSUF9BUElfVXNlcnMifQ.Od1HYRZ9sG9xbGc3KBlmDMl2cEbk6mZRL8YvfeV6FNU
```

**Info del Token:**
- Válido hasta: 2026-12-24
- Issuer: Minnt_Solutions_SA_DE_CV
- Formato header: `Authorization: Bearer {token}`

### Base URL

```
https://api.bind.com.mx/api/
```

---

## 🏢 IDs Reales del Sistema

### Cliente Principal: "Soluciones a la Orden"

```yaml
ClientID: d02c1c47-c9a5-4728-93a0-29e6b6136a15
Name: Soluciones a la Orden
```

### Almacén: "Matriz"

```yaml
WarehouseID: a8605382-7b48-47e2-9fb6-a25cfb7cf735
Name: Matriz
LocationID: d7ef64f2-fd1e-437a-bd93-af01985be5a5
```

### Configuración Financiera

```yaml
LocationID: d7ef64f2-fd1e-437a-bd93-af01985be5a5
PriceListID: 1d5f1d2f-7cd1-4e44-83cc-d47789f70b51
CurrencyID: b7e2c065-bd52-40ca-b508-3accdd538860 # MXN
AddressID: efff1744-da2f-499d-952f-20b9140a95bf
```

### Producto de Ejemplo

```yaml
ProductID: 2d800143-c834-497a-939c-a6e9d19f645f
Name: Cloro Líquido
Price: 9.5 MXN
Unit: Litro
Stock: ~150
```

---

## 📡 Estructura Real del POST

### Endpoint

```http
POST https://api.bind.com.mx/api/Orders
Authorization: Bearer {token}
Content-Type: application/json
```

### Payload (VALIDADO)

```json
{
  "AddressID": "efff1744-da2f-499d-952f-20b9140a95bf",
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "CurrencyID": "b7e2c065-bd52-40ca-b508-3accdd538860",
  "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
  "OrderDate": "2025-11-02T10:30:00Z",
  "PriceListID": "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "Comments": "Requisición ComerECO #REQ-2025-001",
  "PurchaseOrder": null,
  "Products": [
    {
      "ID": "2d800143-c834-497a-939c-a6e9d19f645f",
      "Price": 9.5,
      "Qty": 10,
      "VAT": 0,
      "Comments": "",
      "Unit": "Litro"
    }
  ],
  "Services": []
}
```

### Response Esperada

```json
{
  "status": "success",
  "data": "a4ae8fa0-342d-4793-b298-0007023decb8"
}
```

El campo `data` contiene el UUID de la orden creada.

---

## 🗂️ Archivos Creados/Actualizados

### 1. Documentación

- ✅ [BIND_API_MAP.md](./workflows/BIND_API_MAP.md) - Mapa completo de API
- ✅ [BIND_REAL_IDS.sql](./BIND_REAL_IDS.sql) - Script SQL con IDs reales
- ✅ [RESUMEN_BIND_REAL.md](./RESUMEN_BIND_REAL.md) - Este documento

### 2. Workflows n8n

- ✅ [bind-create-order.json](./workflows/bind-create-order.json) - Workflow ACTUALIZADO con estructura real
- 📦 [bind-create-order.json.template](./workflows/bind-create-order.json.template) - Template original (backup)
- 📦 [nodos-separados](./workflows/nodos-separados) - Workflows de ingeniería inversa

### 3. Configuración

- ✅ [.env.real](../.env.real) - Variables con datos reales
- ✅ [.gitignore](./.gitignore) - Actualizado para proteger secrets

---

## 📊 Diferencias con Template Original

### ❌ Template Original (Incorrecto)

```javascript
// Payload genérico sin validar
const bindItems = items.map(item => ({
  ProductID: item.product_bind_id,
  Quantity: item.quantity,
  UnitPrice: parseFloat(item.unit_price)
}));

return {
  ClientID: clientId,
  BranchID: $json.company_bind_location_id,  // ❌ Campo inexistente
  WarehouseID: warehouseId,
  Items: bindItems,  // ❌ Nombre incorrecto
  // ... faltan campos requeridos
};
```

### ✅ Estructura Real (Validada)

```javascript
// Payload exacto según API real
const bindProducts = items.map(item => ({
  ID: item.product_bind_id,  // ✅ "ID" no "ProductID"
  Price: parseFloat(item.unit_price),  // ✅ "Price" no "UnitPrice"
  Qty: parseInt(item.quantity),  // ✅ "Qty" no "Quantity"
  VAT: 0,  // ✅ Campo VAT requerido
  Comments: "",
  Unit: item.unit || "unidad"  // ✅ Unit requerido
}));

return {
  AddressID: requisitionData.address_id,  // ✅ Requerido
  ClientID: requisitionData.client_id,
  CurrencyID: requisitionData.currency_id,  // ✅ Requerido
  LocationID: requisitionData.location_id,  // ✅ No "BranchID"
  OrderDate: new Date().toISOString(),  // ✅ ISO 8601
  PriceListID: requisitionData.price_list_id,  // ✅ Requerido
  WarehouseID: requisitionData.warehouse_id,
  Comments: requisitionData.comments,
  PurchaseOrder: null,  // ✅ Campo requerido (puede ser null)
  Products: bindProducts,  // ✅ "Products" no "Items"
  Services: []  // ✅ Campo requerido (array vacío)
};
```

---

## 🔍 Hallazgos Importantes

### 1. Estados de Orden (StatusCode)

```yaml
0: Pendiente (recién creada)
1: Surtido (completada)
2: Cancelado (soft delete)
```

### 2. DELETE NO Elimina Físicamente

```
DELETE /Orders/{id}
→ StatusCode cambia de 0 a 2
→ Orden sigue siendo accesible via GET
→ Para filtrar órdenes activas: WHERE StatusCode != 2
```

### 3. Formato OData

Todas las respuestas lista vienen envueltas:

```json
{
  "value": [...]  // ← Array de resultados aquí
}
```

### 4. Paginación

```
GET /Products?$top=100&$skip=0
```

---

## ⚡ Pasos para Implementar MAÑANA

### 1. Ejecutar Script SQL (10 min)

```bash
# En Supabase SQL Editor
# Ejecutar contenido de: BIND_REAL_IDS.sql
```

Esto configurará:
- ✅ Mappings en `bind_mappings`
- ✅ Campos en tabla `companies`
- ✅ Función `build_bind_payload()` actualizada

### 2. Configurar n8n (5 min)

```bash
# 1. Copiar variables reales
cd integrations/n8n
cp .env.real .env

# 2. Completar password de Supabase en .env

# 3. Iniciar n8n
docker-compose up -d
```

### 3. Configurar Credenciales en n8n UI (5 min)

**Credencial 1: Supabase Database**
```
Host: db.azjaehrdzdfgrumbqmuc.supabase.co
Database: postgres
User: postgres
Password: <de-.env>
Port: 5432
SSL: allow
```

**Credencial 2: BIND API Authorization**
```
Type: Header Auth
Header Name: Authorization
Header Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Importar Workflow (2 min)

```
1. Workflows → Import from File
2. Seleccionar: workflows/bind-create-order.json
3. Asignar credenciales
4. Activar workflow
```

### 5. Test End-to-End (10 min)

```sql
-- 1. Crear/aprobar requisición
UPDATE requisitions
SET integration_status = 'pending_sync'
WHERE id = '<requisition-id>';

-- 2. Esperar 30 segundos

-- 3. Verificar
SELECT
  integration_status,
  bind_order_id,
  bind_synced_at
FROM requisitions
WHERE id = '<requisition-id>';

-- Esperado:
-- integration_status: 'synced'
-- bind_order_id: 'uuid-de-bind'
-- bind_synced_at: <timestamp>
```

---

## 📚 Documentación Completa

### Por Orden de Lectura

1. [BIND_API_MAP.md](./workflows/BIND_API_MAP.md) - Referencia completa de API
2. [BIND_REAL_IDS.sql](./BIND_REAL_IDS.sql) - Script de configuración
3. [QUICK_START.md](./QUICK_START.md) - Inicio rápido (5 minutos)
4. [CHECKLIST_MAÑANA.md](./CHECKLIST_MAÑANA.md) - Checklist detallado
5. [docs/SETUP.md](./docs/SETUP.md) - Setup completo

### Documentación General

- [../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md](../../docs/ARQUITECTURA_HIBRIDA_SUPABASE_N8N.md)
- [../../docs/BEST_PRACTICES_INTEGRACIONES.md](../../docs/BEST_PRACTICES_INTEGRACIONES.md)
- [../../docs/TROUBLESHOOTING_INTEGRACIONES.md](../../docs/TROUBLESHOOTING_INTEGRACIONES.md)

---

## ✅ Checklist de Verificación

### Antes de Implementar

- [ ] Token de BIND válido (expira 2026-12-24)
- [ ] Password de Supabase disponible
- [ ] Docker instalado y corriendo
- [ ] Puerto 5678 libre

### Configuración Supabase

- [ ] Script BIND_REAL_IDS.sql ejecutado
- [ ] Tabla `bind_mappings` con 3 registros
- [ ] Tabla `companies` con campos bind_* llenos
- [ ] Función `build_bind_payload()` actualizada
- [ ] Productos con `bind_id` asignado

### Configuración n8n

- [ ] n8n corriendo en localhost:5678
- [ ] Credencial "Supabase Database" configurada
- [ ] Credencial "Bind API Authorization" configurada
- [ ] Workflow "bind-create-order" importado
- [ ] Workflow activado (toggle verde)

### Test

- [ ] Requisición aprobada se encola
- [ ] n8n procesa mensaje
- [ ] Orden creada en BIND
- [ ] `bind_order_id` guardado en Supabase
- [ ] `integration_status` = 'synced'
- [ ] Usuario recibe notificación

---

## 🎉 Resultado Esperado

Al completar la implementación:

```
Usuario aprueba requisición
      ↓ (trigger automático)
Supabase encola en PGMQ (< 100ms)
      ↓ (cada 30 segundos)
n8n procesa mensaje
      ↓ (2-5 segundos)
POST a BIND API
      ↓ (1-3 segundos)
Orden creada en BIND
      ↓ (< 1 segundo)
Supabase actualizado con folio
      ↓ (instantáneo)
Usuario recibe notificación
```

**Tiempo total:** 30-40 segundos (limitado por cron de 30s)

---

## 🆘 Si Algo Falla

### 1. Error 401 en BIND
```
→ Token expirado
→ Regenerar en BIND
→ Actualizar en n8n credentials
```

### 2. Error 400 Bad Request
```
→ Verificar payload en logs de n8n
→ Comparar con estructura en BIND_API_MAP.md
→ Verificar que todos los UUIDs son válidos
```

### 3. Workflow no ejecuta
```
→ Verificar workflow activo (toggle verde)
→ Ver Executions tab en n8n
→ Revisar credenciales configuradas
```

### 4. Mensaje atascado en cola
```sql
-- Ver mensajes
SELECT * FROM pgmq.q_requisition_outbox_queue;

-- Eliminar mensaje problemático
SELECT pgmq.delete('requisition_outbox_queue', <msg_id>);
```

---

## 📞 Soporte

- **BIND API Issues:** soporte@bind.com.mx
- **n8n Community:** https://community.n8n.io
- **Documentación:** Ver carpeta `docs/`

---

**Preparado por:** Claude Code
**Fecha:** 2025-11-02
**Validado:** ✅ Todos los IDs y estructura probados
**Listo para:** Producción

**¡Todo listo para implementar mañana! 🚀**
