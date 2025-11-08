# ⚡ Quick Start - Testing WF-02

**SOLUCIÓN AL ERROR:** Producto mapeado a BIND incluido

---

## 🚨 Problema que Resuelve

El error que tuviste:
```json
{
  "Products": [{
    "ID": "1d2e5169-d727-4a32-8952-295e78be336a"  // ❌ Este ID no existe en BIND
  }]
}
```

**Causa:** El producto no tenía `bind_product_id` configurado.

---

## ✅ Solución en 3 Pasos

### 1️⃣ Ejecutar SQL en Supabase

1. Abre [Supabase SQL Editor](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Click en **SQL Editor** → **New Query**
4. Copia y pega el contenido de: [`COMPLETE-TEST-SETUP.sql`](./COMPLETE-TEST-SETUP.sql)
5. Click **Run** (▶️)

**Esto creará:**
- ✅ Producto: PASTILLA WIESE 70 GR
- ✅ Con `bind_product_id = 30ef79f4-f1ed-4d58-be61-0366a6fe1d20`
- ✅ Requisición de prueba con 5 pastillas ($79.05)
- ✅ Estado: `approved` + `pending_sync`

---

### 2️⃣ Ejecutar Workflow de Testing

1. Abre **n8n**
2. Busca: `WF-02-TEST: Sync Requisitions to BIND (Testing)`
3. Click **Execute Workflow** (▶️)
4. Observa la ejecución

**Resultado esperado:**
- ✅ Nodo "Get Pending Requisitions" → Encuentra 1 requisición
- ✅ Nodo "Transform to BIND Format" → Genera payload con bind_product_id correcto
- ✅ Nodo "MOCK BIND POST" → Simula creación (devuelve UUID)
- ✅ Nodo "MOCK BIND GET" → Simula respuesta completa
- ✅ Nodo "Success or Error?" → Va por path "success"
- ✅ Nodo "Update Status: Synced" → Actualiza requisición
- ✅ Nodo "Log Success" → Crea log

---

### 3️⃣ Verificar Resultados

Ejecuta en Supabase SQL Editor:

```sql
-- Ver requisición sincronizada
SELECT
  internal_folio,
  integration_status,  -- Debe ser 'synced'
  bind_order_id,       -- UUID simulado
  bind_folio,          -- PO-2025-XXXX
  bind_status,         -- StatusID: 0
  bind_synced_at
FROM requisitions
WHERE internal_folio LIKE 'TEST-%'
ORDER BY created_at DESC
LIMIT 1;

-- Ver log de sincronización
SELECT
  status,              -- 'success'
  bind_id,             -- UUID simulado
  request_payload->>'PurchaseOrder' as folio,
  response_payload->>'Number' as bind_folio,
  response_payload->>'TestMode' as es_test,
  synced_at
FROM bind_sync_logs
ORDER BY synced_at DESC
LIMIT 1;
```

**Esperas ver:**
- `integration_status = 'synced'` ✅
- `bind_order_id` con UUID como `8eed5dee-...` ✅
- `bind_folio` como `PO-2025-1234` ✅
- Log con `status = 'success'` ✅
- `TestMode = true` en response_payload ✅

---

## 📋 Payload Generado (Correcto)

Después de ejecutar el SQL, el workflow generará:

```json
{
  "AddressID": "efff1744-da2f-499d-952f-20b9140a95bf",
  "ClientID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
  "CurrencyID": "b7e2c065-bd52-40ca-b508-3accdd538860",
  "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
  "PriceListID": "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
  "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
  "OrderDate": "2025-11-05T17:30:00Z",
  "Comments": "TEST - Requisición de prueba con producto mapeado a BIND",
  "PurchaseOrder": "TEST-20251105-173000",
  "Products": [{
    "ID": "30ef79f4-f1ed-4d58-be61-0366a6fe1d20",  // ✅ ID DE BIND (no Supabase)
    "Price": 15.81,
    "Qty": 5,
    "VAT": 0,
    "Comments": "Pastillas WIESE - producto mapeado a BIND",
    "Unit": "pza"
  }],
  "Services": []
}
```

**Diferencia clave:**
- ❌ Antes: `"ID": "1d2e5169-..."` (UUID de Supabase - no existe en BIND)
- ✅ Ahora: `"ID": "30ef79f4-..."` (UUID de BIND - producto real)

---

## 🧹 Limpiar Datos de Prueba

Cuando termines de probar:

```sql
-- Ver requisiciones de prueba
SELECT id, internal_folio, integration_status
FROM requisitions
WHERE internal_folio LIKE 'TEST-%';

-- Eliminar logs
DELETE FROM bind_sync_logs
WHERE entity_id IN (
  SELECT id FROM requisitions WHERE internal_folio LIKE 'TEST-%'
);

-- Eliminar requisiciones
DELETE FROM requisitions
WHERE internal_folio LIKE 'TEST-%';

-- Opcional: Eliminar producto de prueba
DELETE FROM products
WHERE sku = 'QUI67';
```

---

## 🔄 Para Producción Real

Cuando estés listo para sincronizar a BIND real:

1. **Abre workflow WF-02** (no TEST):
   - `WF-02: Sync Requisitions to BIND`

2. **Verifica configuración:**
   - ✅ Credenciales BIND configuradas
   - ✅ Variables de entorno (`BIND_API_URL`)
   - ✅ Productos con `bind_product_id` configurado

3. **Activa el workflow:**
   - Toggle **Active** = ON
   - Se ejecutará cada 15 minutos automáticamente

4. **Monitorea:**
   - Revisa logs en n8n
   - Verifica sincronización en Supabase
   - Confirma órdenes en BIND

---

## ❓ Troubleshooting

### Error: "No se encontró ninguna compañía"
**Solución:** Crea una compañía primero en Supabase

### Error: "No se encontró ningún proyecto"
**Solución:** Crea un proyecto primero en Supabase

### Error: "No se encontró ningún usuario"
**Solución:** Asegúrate de tener usuarios en `auth.users`

### La requisición no se sincroniza
**Verificar:**
1. ¿Tiene `business_status = 'approved'`?
2. ¿Tiene `integration_status = 'pending_sync'`?
3. ¿El producto tiene `bind_product_id` configurado?

### Workflow va por path "error"
**Causas comunes:**
1. Mock GET no devuelve campo `ID`
2. Switch valida campo incorrecto
3. Conexiones entre nodos incorrectas

---

## 📚 Archivos Relacionados

- [`COMPLETE-TEST-SETUP.sql`](./COMPLETE-TEST-SETUP.sql) - Setup completo (producto + requisición)
- [`WF-02-TEST-Requisition-Sync-to-BIND.json`](./WF-02-TEST-Requisition-Sync-to-BIND.json) - Workflow de testing
- [`WF-02-Requisition-Sync-to-BIND.json`](./WF-02-Requisition-Sync-to-BIND.json) - Workflow de producción
- [`WF-02-WORKFLOWS-COMPARISON.md`](./WF-02-WORKFLOWS-COMPARISON.md) - Comparación workflows
- [`FIX-PRODUCT-MAPPING.sql`](./FIX-PRODUCT-MAPPING.sql) - Solución al mapeo de productos

---

**Última actualización:** 2025-11-05
**Estado:** ✅ Listo para testing con producto mapeado
