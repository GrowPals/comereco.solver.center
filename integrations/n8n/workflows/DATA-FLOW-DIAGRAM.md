# 📊 Diagrama de Flujo de Datos

---

## 🔄 Flujo Completo: Supabase → BIND

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                             │
└─────────────────────────────────────────────────────────┘

1️⃣ DATOS MAESTROS (Cargar UNA VEZ)
─────────────────────────────────────

   ┌──────────────┐
   │  companies   │  ← Tu empresa (ComerECO)
   │              │     - bind_client_id
   │              │     - bind_location_id
   └──────┬───────┘     - bind_price_list_id
          │
          ├──────────────────────────────────┐
          │                                  │
          ▼                                  ▼
   ┌──────────┐                      ┌──────────┐
   │ projects │                      │ products │
   │          │                      │          │
   │ Obras/   │                      │ Catálogo │
   │ Sitios   │                      │          │
   └──────────┘                      └────┬─────┘
                                          │
                                          │ bind_product_id
                                          │ (mapeo a BIND)
                                          ▼


2️⃣ DATOS TRANSACCIONALES (Uso diario)
─────────────────────────────────────

   ┌────────────────┐
   │  requisitions  │  ← Solicitudes de material
   │                │
   │  Status:       │
   │  • draft       │  Usuario crea requisición
   │  • pending     │  Esperando aprobación
   │  • approved    │  ✅ Aprobada
   └────────┬───────┘
            │
            │ business_status = 'approved'
            │ integration_status = 'pending_sync'
            │
            ▼

3️⃣ SINCRONIZACIÓN AUTOMÁTICA (WF-02)
─────────────────────────────────────

   ┌──────────────────────────────────┐
   │  n8n Workflow WF-02              │
   │  (Cada 15 minutos)               │
   │                                  │
   │  1. Get Pending Requisitions     │
   │  2. Transform to BIND Format     │
   │  3. POST to BIND API             │
   │  4. GET Order Details            │
   │  5. Update Status: Synced        │
   └──────────┬───────────────────────┘
              │
              │ Payload:
              │ {
              │   "ClientID": "...",        ← company.bind_client_id
              │   "LocationID": "...",      ← company.bind_location_id
              │   "PriceListID": "...",     ← company.bind_price_list_id
              │   "Products": [{
              │     "ID": "...",            ← product.bind_product_id
              │     "Price": 180.00,
              │     "Qty": 10
              │   }]
              │ }
              │
              ▼

┌─────────────────────────────────────────────────────────┐
│                      BIND ERP                           │
│                                                         │
│  ✅ Orden creada con:                                   │
│     - ID: uuid                                          │
│     - Number: PO-2025-1234                             │
│     - Status: Pendiente                                 │
└─────────────────────────────────────────────────────────┘

              │
              │ Response:
              │ {
              │   "ID": "order-uuid",
              │   "Number": "PO-2025-1234",
              │   "StatusID": 0,
              │   "Status": "Pendiente"
              │ }
              │
              ▼

   ┌────────────────┐
   │  requisitions  │  ← Actualizada en Supabase
   │                │
   │  bind_order_id │  = "order-uuid"
   │  bind_folio    │  = "PO-2025-1234"
   │  bind_status   │  = "StatusID: 0"
   │  synced_at     │  = NOW()
   │                │
   │  Status:       │
   │  • synced ✅   │
   └────────────────┘

              │
              │
              ▼

   ┌──────────────────┐
   │ bind_sync_logs   │  ← Log de la sincronización
   │                  │
   │  request_payload │  = { payload enviado a BIND }
   │  response_payload│  = { response de BIND }
   │  status          │  = 'success'
   └──────────────────┘
```

---

## 🔑 Mapeos Críticos (Supabase → BIND)

### Empresa → Cliente BIND
```
companies.bind_client_id  →  BIND Client.ID
```

### Empresa → Ubicación BIND
```
companies.bind_location_id  →  BIND Location.ID
```

### Empresa → Lista de Precios BIND
```
companies.bind_price_list_id  →  BIND PriceList.ID
```

### Producto → Producto BIND
```
products.bind_product_id  →  BIND Product.ID
```

---

## 📦 Ejemplo Completo

### En Supabase:

```sql
-- Empresa
companies {
  id: "abc-123",
  name: "ComerECO",
  bind_client_id: "d02c1c47-..."  ← ID en BIND
}

-- Producto
products {
  id: "def-456",
  sku: "CEM-001",
  name: "Cemento 50kg",
  bind_product_id: "30ef79f4-..."  ← ID en BIND
}

-- Requisición
requisitions {
  id: "ghi-789",
  internal_folio: "REQ-5038",
  company_id: "abc-123",
  items: [
    {
      product_id: "def-456",          ← Producto Supabase
      bind_product_id: "30ef79f4-...", ← Producto BIND
      quantity: 10,
      unit_price: 180.00
    }
  ],
  business_status: "approved",
  integration_status: "pending_sync"
}
```

### Workflow transforma a:

```json
{
  "ClientID": "d02c1c47-...",
  "LocationID": "d7ef64f2-...",
  "PriceListID": "1d5f1d2f-...",
  "Products": [{
    "ID": "30ef79f4-...",  ← bind_product_id
    "Price": 180.00,
    "Qty": 10
  }]
}
```

### BIND crea orden:

```json
{
  "ID": "order-uuid",
  "Number": "PO-2025-1234",
  "StatusID": 0,
  "Status": "Pendiente",
  "Products": [...]
}
```

### Supabase actualiza:

```sql
-- Requisición actualizada
requisitions {
  ...
  bind_order_id: "order-uuid",
  bind_folio: "PO-2025-1234",
  bind_status: "StatusID: 0",
  bind_synced_at: "2025-11-05 17:30:00",
  integration_status: "synced"
}
```

---

## ⚠️ Puntos Críticos

### 1. Sin bind_product_id → ERROR
```
❌ NO FUNCIONA:
products.bind_product_id = NULL

✅ DEBE TENER:
products.bind_product_id = "30ef79f4-..."
```

### 2. IDs incorrectos → ERROR
```
❌ UUID de Supabase enviado a BIND:
"ID": "def-456"  (no existe en BIND)

✅ UUID de BIND enviado a BIND:
"ID": "30ef79f4-..."  (producto real en BIND)
```

### 3. Sin company IDs → Usar defaults
```
Si company.bind_client_id = NULL
→ Workflow usa default: "d02c1c47-..."
```

---

## 📋 Orden de Carga Resumido

```
1. companies       (Con bind_client_id, bind_location_id, bind_price_list_id)
   ↓
2. projects        (Relacionados a company)
   ↓
3. products        (Con bind_product_id de BIND)
   ↓
4. requisitions    (Se crean desde la app)
   ↓
5. WF-02 sincroniza automáticamente
```

---

**Última actualización:** 2025-11-05
