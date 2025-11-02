# 🔗 GUÍA PARA N8N: CÓMO CONSUMIR INFORMACIÓN DE SUPABASE

**Fecha:** 2025-01-31  
**Objetivo:** Documentar cómo n8n puede obtener fácilmente la información de requisiciones aprobadas desde Supabase

---

## 🎯 ESCENARIO: REQUISICIÓN APROBADA → CREAR PEDIDO EN BIND ERP

Cuando un supervisor aprueba una requisición:
1. La requisición cambia a `business_status = 'approved'` y `integration_status = 'pending_sync'`
2. n8n detecta este cambio (mediante webhook o polling)
3. n8n obtiene toda la información necesaria con una sola llamada
4. n8n crea el pedido en Bind ERP
5. n8n actualiza el estado en Supabase

---

## 📡 OPCIÓN 1: WEBHOOK DE SUPABASE (RECOMENDADO)

Supabase puede enviar webhooks cuando cambia una requisición. Configura el webhook para escuchar cambios en `requisitions`:

### Configuración del Webhook en Supabase

1. Ve a **Database** → **Webhooks** en Supabase Dashboard
2. Crea un nuevo webhook con:
   - **Table:** `requisitions`
   - **Events:** `UPDATE`
   - **Filter:** `business_status = 'approved' AND integration_status = 'pending_sync'`
   - **URL:** `https://tu-n8n-instance.com/webhook/supabase-requisition-approved`

### En n8n: Nodo Webhook

```
Nodo 1: Webhook
- Method: POST
- Path: /webhook/supabase-requisition-approved
- Response Mode: Response Node
```

El webhook recibirá algo como:
```json
{
  "type": "UPDATE",
  "table": "requisitions",
  "record": {
    "id": "uuid-de-la-requisicion",
    "business_status": "approved",
    "integration_status": "pending_sync",
    ...
  }
}
```

### En n8n: Obtener Información Completa

```
Nodo 2: HTTP Request (Supabase)
- Method: POST
- URL: https://[tu-proyecto].supabase.co/rest/v1/rpc/get_requisition_for_bind
- Headers:
  - apikey: [SUPABASE_ANON_KEY]
  - Authorization: Bearer [SUPABASE_ANON_KEY]
  - Content-Type: application/json
- Body:
  {
    "p_requisition_id": "{{$json.record.id}}"
  }
```

**Respuesta que recibirás:**
```json
{
  "requisition": {
    "id": "uuid",
    "internal_folio": "REQ-2025-0001",
    "total_amount": 11600.00,
    "comments": "Material para limpieza mensual",
    "business_status": "approved",
    "integration_status": "pending_sync",
    "approved_at": "2025-01-31T10:05:00Z",
    ...
  },
  "company": {
    "id": "uuid",
    "name": "Soluciones a la Orden",
    "bind_location_id": "LOC-123",
    "bind_price_list_id": "PL-456"
  },
  "project": {
    "id": "uuid",
    "name": "Planta Industrial XYZ"
  },
  "requester": {
    "id": "uuid",
    "full_name": "José García",
    "email": "jose@solucionesalorden.com"
  },
  "approver": {
    "id": "uuid",
    "full_name": "María López",
    "role_v2": "supervisor"
  },
  "items": [
    {
      "product_id": "uuid",
      "bind_product_id": "PROD-789",
      "product_name": "Cloro Industrial 5L",
      "product_sku": "CLO-5L-001",
      "quantity": 3,
      "unit_price": 120.00,
      "subtotal": 360.00
    }
  ]
}
```

### En n8n: Crear Pedido en Bind ERP

```
Nodo 3: HTTP Request (Bind API)
- Method: POST
- URL: [URL_API_BIND]/api/purchase-orders
- Headers:
  - Authorization: Bearer [BIND_API_TOKEN]
  - Content-Type: application/json
- Body:
  {
    "ClientID": "{{$json.company.bind_location_id}}", // o mapear desde bind_mappings
    "BranchID": "{{$json.company.bind_location_id}}",
    "Items": {{$json.items.map(item => ({
      "ProductID": item.bind_product_id,
      "Quantity": item.quantity,
      "UnitPrice": item.unit_price
    }))}},
    "Comment": "Requisición ComerECO #{{$json.requisition.internal_folio}} - Solicitante: {{$json.requester.full_name}}"
  }
```

### En n8n: Actualizar Estado en Supabase

Si Bind retorna éxito:
```
Nodo 4: HTTP Request (Supabase)
- Method: POST
- URL: https://[proyecto].supabase.co/rest/v1/rpc/update_bind_sync_status
- Headers:
  - apikey: [SUPABASE_ANON_KEY]
  - Authorization: Bearer [SUPABASE_ANON_KEY]
  - Content-Type: application/json
- Body:
  {
    "p_requisition_id": "{{$json.requisition.id}}",
    "p_bind_folio": "{{$json.bindResponse.folio}}",
    "p_success": true,
    "p_error_message": null
  }
```

Si Bind retorna error:
```
Nodo 5: HTTP Request (Supabase) - Error Handler
- Method: POST
- URL: https://[proyecto].supabase.co/rest/v1/rpc/update_bind_sync_status
- Body:
  {
    "p_requisition_id": "{{$json.requisition.id}}",
    "p_bind_folio": null,
    "p_success": false,
    "p_error_message": "{{$json.error.message}}"
  }
```

---

## 📡 OPCIÓN 2: POLLING (CONSULTA PERIÓDICA)

Si prefieres consultar periódicamente en lugar de webhooks:

### En n8n: Cron Trigger

```
Nodo 1: Cron
- Schedule: */5 * * * * (cada 5 minutos)
```

### En n8n: Obtener Requisiciones Pendientes

```
Nodo 2: HTTP Request (Supabase)
- Method: GET
- URL: https://[proyecto].supabase.co/rest/v1/requisitions_pending_sync
- Headers:
  - apikey: [SUPABASE_ANON_KEY]
  - Authorization: Bearer [SUPABASE_ANON_KEY]
```

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "internal_folio": "REQ-2025-0001",
    "company_id": "uuid",
    "project_id": "uuid",
    "total_amount": 11600.00,
    "approved_at": "2025-01-31T10:05:00Z",
    "company_name": "Soluciones a la Orden",
    "bind_location_id": "LOC-123",
    ...
  }
]
```

### En n8n: Loop sobre Cada Requisición

```
Nodo 3: Split In Batches
- Batch Size: 1
```

Para cada requisición, llamar a `get_requisition_for_bind()` y procesar como en la Opción 1.

---

## 🔧 FUNCIONES ÚTILES DISPONIBLES

### 1. `get_requisition_for_bind(requisition_id)`

Obtiene toda la información estructurada de una requisición.

**Llamada:**
```http
POST /rest/v1/rpc/get_requisition_for_bind
{
  "p_requisition_id": "uuid"
}
```

**Retorna:** JSON completo con requisición, empresa, proyecto, solicitante, aprobador e items.

---

### 2. `update_bind_sync_status(requisition_id, bind_folio, success, error_message)`

Actualiza el estado de sincronización después de procesar en Bind.

**Llamada exitosa:**
```http
POST /rest/v1/rpc/update_bind_sync_status
{
  "p_requisition_id": "uuid",
  "p_bind_folio": "PO-2025-1234",
  "p_success": true,
  "p_error_message": null
}
```

**Llamada con error:**
```http
POST /rest/v1/rpc/update_bind_sync_status
{
  "p_requisition_id": "uuid",
  "p_bind_folio": null,
  "p_success": false,
  "p_error_message": "Error al conectar con Bind API"
}
```

---

### 3. Vista `requisitions_pending_sync`

Consulta rápida de requisiciones pendientes de sincronizar.

**Llamada:**
```http
GET /rest/v1/requisitions_pending_sync?limit=10
```

**Retorna:** Array de requisiciones con información básica.

---

## 📊 ESTRUCTURA DE DATOS DISPONIBLE

### Información de Requisición
- `id`, `internal_folio`, `total_amount`
- `comments`, `business_status`, `integration_status`
- `created_at`, `updated_at`, `approved_at`
- `bind_folio`, `bind_synced_at`, `bind_error_message`, `bind_sync_attempts`

### Información de Empresa
- `company.id`, `company.name`
- `company.bind_location_id`, `company.bind_price_list_id`

### Información de Proyecto
- `project.id`, `project.name`, `project.description`

### Información de Usuarios
- `requester.id`, `requester.full_name`, `requester.email`
- `approver.id`, `approver.full_name`, `approver.role_v2`, `approver.email`

### Items con Productos
- `items[].id`, `items[].product_id`, `items[].bind_product_id`
- `items[].product_name`, `items[].product_sku`
- `items[].quantity`, `items[].unit_price`, `items[].subtotal`
- `items[].unit`, `items[].category`

---

## 🎯 EJEMPLO COMPLETO DE WORKFLOW N8N

```
1. Webhook (Supabase) → Recibe evento de requisición aprobada
2. HTTP Request → get_requisition_for_bind(requisition_id)
3. Function → Transformar datos a formato Bind ERP
4. HTTP Request → Crear pedido en Bind API
5. IF → ¿Éxito?
   ├─ SÍ → update_bind_sync_status(success=true, bind_folio=...)
   └─ NO → update_bind_sync_status(success=false, error_message=...)
6. HTTP Request → Enviar notificación al usuario (opcional)
```

---

## 🔐 SEGURIDAD

### Credenciales
- Usa **Service Role Key** de Supabase en n8n (no Anon Key)
- Almacena credenciales de Bind API en variables de entorno de n8n
- No expongas tokens en logs

### Validaciones
- Verifica que `integration_status = 'pending_sync'` antes de procesar
- Verifica que `business_status = 'approved'` antes de procesar
- Maneja errores de Bind API gracefully

---

## 📝 NOTAS IMPORTANTES

1. **Una sola llamada:** `get_requisition_for_bind()` retorna TODO lo necesario
2. **Estructura clara:** JSON bien estructurado con toda la información
3. **Fácil actualizar:** `update_bind_sync_status()` actualiza estado fácilmente
4. **Optimizado:** Índices y vistas optimizadas para consultas rápidas

---

**Documento creado:** 2025-01-31  
**Para uso con:** n8n workflows de integración con Bind ERP

