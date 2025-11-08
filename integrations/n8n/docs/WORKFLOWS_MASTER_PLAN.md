# 🎯 Plan Maestro de Workflows - COMERECO n8n Integration

**Versión:** 1.0.0
**Fecha Inicial:** 2025-11-05
**Última Actualización:** 2025-11-05
**Estado:** 🔵 Planificación

---

## 📋 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Workflows Principales](#workflows-principales)
   - [WF-01: Monitoreo de Stock Bajo](#wf-01-monitoreo-de-stock-bajo)
   - [WF-02: Sincronización de Requisiciones a BIND](#wf-02-sincronización-de-requisiciones-a-bind)
   - [WF-03: Actualización de Productos desde BIND](#wf-03-actualización-de-productos-desde-bind)
   - [WF-04: Sincronización de Inventario BIND → Supabase](#wf-04-sincronización-de-inventario-bind--supabase)
   - [WF-05: Notificaciones de Requisiciones](#wf-05-notificaciones-de-requisiciones)
   - [WF-06: Retry de Sincronizaciones Fallidas](#wf-06-retry-de-sincronizaciones-fallidas)
3. [Roadmap de Implementación](#roadmap-de-implementación)
4. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)
5. [Monitoreo y Alertas](#monitoreo-y-alertas)
6. [Control de Cambios](#control-de-cambios)

---

## 🏗️ Arquitectura General

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMERECO System                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐        ┌──────────────┐ │
│  │   Frontend   │────────▶│   Supabase   │◀──────│     n8n      │ │
│  │   Next.js    │         │   Database   │        │  Automation  │ │
│  └──────────────┘         └──────┬───────┘        └───────┬──────┘ │
│                                   │                        │         │
│                                   │                        │         │
│                                   ▼                        ▼         │
│                           ┌───────────────┐      ┌─────────────┐    │
│                           │  RLS Policies │      │   n8n DB    │    │
│                           │  Functions    │      │ (SQLite/PG) │    │
│                           │  Triggers     │      └─────────────┘    │
│                           └───────────────┘                         │
│                                                                      │
└────────────────────────────┬─────────────────────────────┬──────────┘
                             │                             │
                             ▼                             ▼
                    ┌─────────────────┐         ┌──────────────────┐
                    │   BIND ERP API  │         │  Email / Slack   │
                    │  (External)     │         │  Notifications   │
                    └─────────────────┘         └──────────────────┘
```

### Flujo de Datos Principal

1. **Supabase** → Almacena toda la información (productos, requisiciones, inventario)
2. **n8n** → Orquesta las automatizaciones entre Supabase y BIND
3. **BIND ERP** → Sistema externo para órdenes de compra
4. **Notificaciones** → Alertas a usuarios (email, Slack, etc.)

---

## 🔄 Workflows Principales

---

### WF-01: Monitoreo de Stock Bajo

**Objetivo:** Detectar productos con stock bajo y crear requisiciones automáticas o alertas.

**Prioridad:** 🔴 Alta
**Complejidad:** 🟡 Media
**Estado:** ⏳ Pendiente

#### 📊 Estrategia de Trigger

**Opción A: Scheduled (Recomendado para MVP)**
- **Tipo:** Cron Schedule
- **Frecuencia:**
  - `0 8 * * 1-5` - Lunes a Viernes 8:00 AM
  - `0 14 * * 1-5` - Lunes a Viernes 2:00 PM
- **Ventajas:** Simple, predecible, no sobrecarga la base de datos
- **Desventajas:** No es tiempo real (máximo delay de 6 horas)

**Opción B: Database Trigger + Webhook (Futuro)**
- **Tipo:** Webhook en n8n + Trigger en Supabase
- **Trigger SQL:**
  ```sql
  CREATE OR REPLACE FUNCTION notify_n8n_low_stock()
  RETURNS trigger AS $$
  BEGIN
    -- Solo si el stock cruza el umbral mínimo
    IF NEW.stock < (
      SELECT min_stock FROM inventory_restock_rules
      WHERE product_id = NEW.id AND status = 'active' LIMIT 1
    ) THEN
      PERFORM net.http_post(
        url := 'https://n8n.tu-dominio.com/webhook/low-stock',
        body := jsonb_build_object(
          'product_id', NEW.id,
          'company_id', NEW.company_id,
          'current_stock', NEW.stock,
          'event_type', 'stock_below_threshold'
        )
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

  CREATE TRIGGER trigger_notify_low_stock
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION notify_n8n_low_stock();
  ```
- **Ventajas:** Tiempo real, reacciona inmediatamente
- **Desventajas:** Más complejo, requiere net.http_post extension

**🎯 Decisión Recomendada:** Empezar con **Opción A (Scheduled)** para MVP, migrar a **Opción B** cuando el sistema madure.

#### 🔍 Fuente de Datos

**Query Principal:**
```sql
SELECT
  rule_id,
  company_id,
  product_id,
  product_name,
  product_sku,
  product_category,
  current_stock,
  min_stock,
  reorder_quantity,
  stock_deficit,
  alert_level,
  project_id,
  project_name,
  preferred_vendor,
  preferred_warehouse,
  notes,
  last_rule_update,
  triggers_last_30_days,
  last_trigger_date
FROM restock_alerts_dashboard
WHERE
  alert_level IN ('CRITICAL', 'HIGH', 'MEDIUM')  -- Solo alertas activas
  AND current_stock < min_stock                   -- Verificación adicional
ORDER BY
  CASE alert_level
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
  END,
  stock_deficit DESC;
```

**Datos de Salida:**
```json
[
  {
    "rule_id": "uuid",
    "company_id": "uuid",
    "product_id": "uuid",
    "product_name": "Cemento Gris 50kg",
    "product_sku": "CEM-50-GR",
    "current_stock": 5,
    "min_stock": 20,
    "reorder_quantity": 50,
    "stock_deficit": 15,
    "alert_level": "HIGH",
    "project_id": "uuid",
    "project_name": "Obra Torres del Sol",
    "preferred_vendor": "Cementos Mexicanos"
  }
]
```

#### ⚙️ Nodos del Workflow

```
[1. Schedule Trigger]
      │
      ▼
[2. Postgres: Query restock_alerts_dashboard]
      │
      ▼
[3. IF: Has alerts?]
      │
      ├─── NO ──▶ [End]
      │
      YES
      ▼
[4. Split Into Items] (Loop por cada producto)
      │
      ▼
[5. Decision: Action Type]
      │
      ├─── AUTO_REORDER ──▶ [6A. Create Requisition]
      │                           │
      │                           ▼
      │                     [7A. Log Action]
      │
      ├─── NOTIFY_ADMIN ──▶ [6B. Send Email/Slack]
      │                           │
      │                           ▼
      │                     [7B. Log Notification]
      │
      └─── BIND_DIRECT ───▶ [6C. POST to BIND API]
                                  │
                                  ▼
                            [7C. Update Supabase]
                                  │
                                  ▼
                            [8C. Log Sync]
```

#### 🔧 Configuración de Nodos

**Nodo 1: Schedule Trigger**
```json
{
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 8,14 * * 1-5"
        }
      ]
    }
  }
}
```

**Nodo 2: Postgres Query**
```json
{
  "type": "n8n-nodes-base.postgres",
  "parameters": {
    "operation": "executeQuery",
    "query": "=SELECT * FROM restock_alerts_dashboard WHERE alert_level IN ('CRITICAL', 'HIGH', 'MEDIUM') ORDER BY alert_level, stock_deficit DESC;",
    "options": {}
  },
  "credentials": {
    "postgres": {
      "id": "1",
      "name": "Supabase Production"
    }
  }
}
```

**Nodo 3: IF Node**
```json
{
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "number": [
        {
          "value1": "={{$json.length}}",
          "operation": "larger",
          "value2": 0
        }
      ]
    }
  }
}
```

**Nodo 6A: Create Requisition (Function Node)**
```javascript
// Llamar a la función create_full_requisition
const items = [];
for (const alert of $input.all()) {
  const requisitionData = {
    company_id: alert.json.company_id,
    created_by: 'SYSTEM_AUTO_RESTOCK', // Usuario del sistema
    project_id: alert.json.project_id,
    items: [{
      product_id: alert.json.product_id,
      quantity: alert.json.reorder_quantity,
      unit_price: 0, // Se llenará desde products
    }],
    comments: `Requisición automática - Stock bajo (${alert.json.alert_level})`,
    business_status: 'submitted', // Auto-submit
    integration_status: 'pending_sync'
  };

  items.push({
    json: {
      query: `SELECT create_full_requisition(
        '${requisitionData.company_id}'::uuid,
        '${requisitionData.created_by}'::uuid,
        '${requisitionData.project_id}'::uuid,
        '${JSON.stringify(requisitionData.items)}'::jsonb,
        '${requisitionData.comments}'
      )`,
      alert_data: alert.json
    }
  });
}

return items;
```

**Nodo 6B: Send Email (Gmail/SMTP)**
```json
{
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "alerts@comereco.com",
    "toEmail": "=={{$json.preferred_vendor_email}}",
    "subject": "⚠️ Stock Bajo - {{$json.product_name}}",
    "emailFormat": "html",
    "text": "=<h2>Alerta de Stock Bajo</h2>\n<p><strong>Producto:</strong> {{$json.product_name}} ({{$json.product_sku}})</p>\n<p><strong>Stock Actual:</strong> {{$json.current_stock}}</p>\n<p><strong>Stock Mínimo:</strong> {{$json.min_stock}}</p>\n<p><strong>Cantidad a Ordenar:</strong> {{$json.reorder_quantity}}</p>\n<p><strong>Nivel de Alerta:</strong> {{$json.alert_level}}</p>"
  }
}
```

**Nodo 7A: Log Action**
```sql
INSERT INTO inventory_restock_rule_logs (
  rule_id,
  product_id,
  company_id,
  trigger_type,
  stock_at_trigger,
  min_stock_at_trigger,
  reorder_quantity_sent,
  requisition_id,
  notes
) VALUES (
  '{{$json.rule_id}}',
  '{{$json.product_id}}',
  '{{$json.company_id}}',
  'automatic_schedule',
  {{$json.current_stock}},
  {{$json.min_stock}},
  {{$json.reorder_quantity}},
  '{{$json.requisition_id}}',
  'Requisición creada automáticamente por n8n'
);
```

#### 🚨 Manejo de Errores

**Error Handling Strategy:**

1. **Si falla la query a Supabase:**
   - Retry: 3 intentos con backoff exponencial (1min, 2min, 4min)
   - Alert: Email a admin@comereco.com
   - Log: Registrar en n8n error logs

2. **Si falla crear requisición:**
   - Crear notificación manual en `notifications` table
   - Email a supervisor del proyecto
   - Log: `inventory_restock_rule_logs` con `error_message`

3. **Si falla enviar email:**
   - Crear notificación in-app
   - Retry después de 5 minutos
   - Si falla 3 veces, escalar a Slack

#### 📈 Métricas y Logs

**Registrar en cada ejecución:**
```sql
INSERT INTO workflow_execution_logs (
  workflow_name,
  execution_id,
  started_at,
  finished_at,
  status,
  items_processed,
  items_success,
  items_failed,
  metadata
) VALUES (
  'WF-01-stock-monitoring',
  '{{$execution.id}}',
  '{{$execution.startedAt}}',
  NOW(),
  'success',
  {{$json.total_alerts}},
  {{$json.requisitions_created}},
  {{$json.failures}},
  '{"alert_levels": {"CRITICAL": 2, "HIGH": 5, "MEDIUM": 3}}'::jsonb
);
```

---

### WF-02: Sincronización de Requisiciones a BIND

**Objetivo:** Enviar requisiciones aprobadas a BIND ERP para crear órdenes de compra.

**Prioridad:** 🔴 Alta
**Complejidad:** 🔴 Alta
**Estado:** ⏳ Pendiente

#### 📊 Estrategia de Trigger

**Opción A: Scheduled Poll (Recomendado para MVP)**
- **Tipo:** Cron Schedule
- **Frecuencia:** `*/15 * * * *` - Cada 15 minutos
- **Ventajas:**
  - Simple de implementar
  - Control sobre rate limiting de BIND API
  - Batch processing eficiente
- **Desventajas:** Delay máximo de 15 minutos

**Opción B: Database Trigger + Webhook (Recomendado para Producción)**
- **Tipo:** Webhook + Supabase Trigger
- **Trigger SQL:**
  ```sql
  CREATE OR REPLACE FUNCTION notify_n8n_requisition_approved()
  RETURNS trigger AS $$
  BEGIN
    -- Solo cuando cambia a approved y está pending_sync
    IF NEW.business_status = 'approved'
       AND NEW.integration_status = 'pending_sync'
       AND OLD.business_status != 'approved' THEN

      PERFORM net.http_post(
        url := 'https://n8n.tu-dominio.com/webhook/requisition-approved',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'event_type', 'requisition_approved',
          'requisition_id', NEW.id,
          'company_id', NEW.company_id,
          'internal_folio', NEW.internal_folio,
          'total_amount', NEW.total_amount,
          'approved_at', NEW.approved_at,
          'approved_by', NEW.approved_by
        )
      );
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp;

  CREATE TRIGGER trigger_notify_requisition_approved
    AFTER UPDATE ON requisitions
    FOR EACH ROW
    WHEN (NEW.business_status = 'approved' AND NEW.integration_status = 'pending_sync')
    EXECUTE FUNCTION notify_n8n_requisition_approved();
  ```
- **Ventajas:** Tiempo real, envío inmediato a BIND
- **Desventajas:** Más complejo, requiere webhook seguro

**Opción C: Supabase Realtime (Experimental)**
- **Tipo:** Supabase Realtime subscription en n8n
- **No recomendado:** n8n no tiene soporte nativo para Supabase Realtime

**🎯 Decisión Recomendada:**
- **MVP:** Opción A (Scheduled)
- **Producción:** Opción B (Trigger + Webhook)

#### 🔍 Fuente de Datos

**Query Principal:**
```sql
SELECT
  r.id as requisition_id,
  r.internal_folio,
  r.company_id,
  r.project_id,
  r.total_amount,
  r.comments,
  r.approved_at,
  r.approved_by,
  r.business_status,
  r.integration_status,
  r.bind_sync_attempts,
  r.items as requisition_items,
  -- Project info
  p.name as project_name,
  p.location as project_location,
  -- Company info
  c.name as company_name,
  c.bind_client_id,
  -- Approver info
  pr.full_name as approver_name,
  pr.email as approver_email
FROM requisitions r
LEFT JOIN projects p ON p.id = r.project_id
LEFT JOIN companies c ON c.id = r.company_id
LEFT JOIN profiles pr ON pr.id = r.approved_by
WHERE
  r.business_status = 'approved'
  AND r.integration_status = 'pending_sync'
  AND r.bind_synced_at IS NULL
  AND r.bind_sync_attempts < 3  -- Max 3 intentos
ORDER BY r.approved_at ASC
LIMIT 10;  -- Process max 10 per batch
```

**Estructura de `requisition_items` (JSONB):**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "quantity": 50,
    "unit_price": 250.00,
    "subtotal": 12500.00,
    "product_name": "Cemento Gris 50kg",
    "product_sku": "CEM-50-GR",
    "bind_product_id": "PROD-12345"
  }
]
```

#### 🔌 Integración con BIND API

**Endpoint:** `POST https://api.bind.com.mx/v1/purchase-orders`

**Request Payload:**
```json
{
  "external_reference": "REQ-2025-001",
  "client_id": "CLI-COMERECO-001",
  "project": {
    "name": "Obra Torres del Sol",
    "location": "Guadalajara, JAL"
  },
  "order_date": "2025-11-05T14:30:00Z",
  "requested_delivery_date": "2025-11-12T00:00:00Z",
  "notes": "Materiales urgentes para obra",
  "items": [
    {
      "product_code": "CEM-50-GR",
      "product_name": "Cemento Gris 50kg",
      "quantity": 50,
      "unit_price": 250.00,
      "subtotal": 12500.00,
      "bind_product_id": "PROD-12345"
    }
  ],
  "totals": {
    "subtotal": 12500.00,
    "tax": 2000.00,
    "total": 14500.00
  }
}
```

**Response Esperada (Success):**
```json
{
  "success": true,
  "order_id": "ORD-BIND-98765",
  "folio": "OC-2025-1234",
  "status": "pending_approval",
  "created_at": "2025-11-05T14:35:00Z",
  "estimated_delivery": "2025-11-12T00:00:00Z"
}
```

**Response Esperada (Error):**
```json
{
  "success": false,
  "error_code": "INVALID_PRODUCT",
  "error_message": "El producto CEM-50-GR no existe en el catálogo de BIND",
  "details": {
    "invalid_items": ["CEM-50-GR"]
  }
}
```

#### ⚙️ Nodos del Workflow

```
[1. Trigger: Schedule/Webhook]
      │
      ▼
[2. Postgres: Query Pending Requisitions]
      │
      ▼
[3. IF: Has requisitions?]
      │
      ├─── NO ──▶ [End]
      │
      YES
      ▼
[4. Loop: For each requisition]
      │
      ▼
[5. Function: Transform to BIND format]
      │
      ▼
[6. HTTP Request: POST to BIND API]
      │
      ├─── SUCCESS ──▶ [7. Update: integration_status = 'synced']
      │                     │
      │                     ▼
      │               [8. Log Success to bind_sync_logs]
      │                     │
      │                     ▼
      │               [9. Notification: Email to approver]
      │
      └─── ERROR ──▶ [10. Update: integration_status = 'sync_failed']
                          │
                          ▼
                    [11. Log Error to bind_sync_logs]
                          │
                          ▼
                    [12. Notification: Alert to admin]
```

#### 🔧 Configuración de Nodos

**Nodo 5: Transform to BIND Format**
```javascript
// Function Node
const requisition = $input.item.json;

// Parse items from JSONB
const items = typeof requisition.requisition_items === 'string'
  ? JSON.parse(requisition.requisition_items)
  : requisition.requisition_items;

// Transform to BIND format
const bindPayload = {
  external_reference: requisition.internal_folio,
  client_id: requisition.bind_client_id,
  project: {
    name: requisition.project_name,
    location: requisition.project_location || 'N/A'
  },
  order_date: requisition.approved_at,
  requested_delivery_date: null, // Calculate: approved_at + 7 days
  notes: requisition.comments || 'Orden generada automáticamente',
  items: items.map(item => ({
    product_code: item.product_sku,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: parseFloat(item.unit_price),
    subtotal: parseFloat(item.subtotal),
    bind_product_id: item.bind_product_id || null
  })),
  totals: {
    subtotal: parseFloat(requisition.total_amount),
    tax: parseFloat(requisition.total_amount) * 0.16,
    total: parseFloat(requisition.total_amount) * 1.16
  },
  metadata: {
    requisition_id: requisition.requisition_id,
    approved_by: requisition.approver_name,
    sync_timestamp: new Date().toISOString()
  }
};

return {
  json: {
    requisition_id: requisition.requisition_id,
    company_id: requisition.company_id,
    bind_payload: bindPayload
  }
};
```

**Nodo 6: HTTP Request to BIND**
```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "={{$env.BIND_API_URL}}/purchase-orders",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{$env.BIND_API_TOKEN}}"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        },
        {
          "name": "X-Request-ID",
          "value": "={{$execution.id}}"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": []
    },
    "jsonParameters": true,
    "body": "={{JSON.stringify($json.bind_payload)}}",
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3,
        "waitBetweenTries": 2000
      }
    }
  }
}
```

**Nodo 7: Update Success**
```sql
UPDATE requisitions
SET
  integration_status = 'synced',
  bind_order_id = '{{$json.order_id}}',
  bind_folio = '{{$json.folio}}',
  bind_status = '{{$json.status}}',
  bind_synced_at = NOW(),
  bind_error_message = NULL,
  updated_at = NOW()
WHERE id = '{{$json.requisition_id}}';
```

**Nodo 8: Log Success**
```sql
INSERT INTO bind_sync_logs (
  company_id,
  sync_type,
  entity_type,
  entity_id,
  bind_id,
  status,
  request_payload,
  response_payload,
  synced_at
) VALUES (
  '{{$json.company_id}}',
  'requisition',
  'requisition',
  '{{$json.requisition_id}}',
  '{{$json.order_id}}',
  'success',
  '{{$json.bind_payload}}'::jsonb,
  '{{$json.response}}'::jsonb,
  NOW()
);
```

**Nodo 10: Update Error**
```sql
UPDATE requisitions
SET
  integration_status = 'sync_failed',
  bind_error_message = '{{$json.error_message}}',
  bind_sync_attempts = bind_sync_attempts + 1,
  updated_at = NOW()
WHERE id = '{{$json.requisition_id}}';
```

**Nodo 11: Log Error**
```sql
INSERT INTO bind_sync_logs (
  company_id,
  sync_type,
  entity_type,
  entity_id,
  status,
  request_payload,
  error_message,
  synced_at
) VALUES (
  '{{$json.company_id}}',
  'requisition',
  'requisition',
  '{{$json.requisition_id}}',
  'failed',
  '{{$json.bind_payload}}'::jsonb,
  '{{$json.error_message}}',
  NOW()
);
```

#### 🚨 Manejo de Errores Específicos

**Error 1: Producto no existe en BIND**
```javascript
// Function Node
if (error.error_code === 'INVALID_PRODUCT') {
  // Crear notificación para admin
  const invalidProducts = error.details.invalid_items;

  return {
    json: {
      action: 'create_missing_products',
      products: invalidProducts,
      requisition_id: requisition.id,
      error_type: 'missing_products'
    }
  };
}
```

**Error 2: Cliente no autorizado**
```javascript
if (error.error_code === 'UNAUTHORIZED_CLIENT') {
  // Pausar todas las sincronizaciones de esta empresa
  // Notificar a platform admin
  return {
    json: {
      action: 'pause_company_sync',
      company_id: requisition.company_id,
      error_type: 'unauthorized'
    }
  };
}
```

**Error 3: Rate Limit de BIND**
```javascript
if (error.error_code === 'RATE_LIMIT_EXCEEDED') {
  // Esperar y reintentar
  return {
    json: {
      action: 'retry_after',
      retry_seconds: error.retry_after || 60,
      requisition_id: requisition.id
    }
  };
}
```

#### 📊 Estados y Transiciones

**Estado de Sincronización:**
```
pending_sync → syncing → synced
                    ↓
                sync_failed → (retry) → syncing
                    ↓
                (max 3 tries) → requires_manual_review
```

**Actualización de business_status tras sync exitoso:**
```sql
-- Opcional: Cambiar business_status a 'ordered' automáticamente
UPDATE requisitions
SET business_status = 'ordered'
WHERE id = '{{$json.requisition_id}}'
  AND integration_status = 'synced'
  AND business_status = 'approved';
```

---

### WF-03: Actualización de Productos desde BIND

**Objetivo:** Sincronizar catálogo de productos desde BIND ERP a Supabase.

**Prioridad:** 🟡 Media
**Complejidad:** 🟡 Media
**Estado:** ⏳ Pendiente

#### 📊 Estrategia de Trigger

**Opción A: Scheduled Full Sync (Recomendado para inicio)**
- **Tipo:** Cron Schedule
- **Frecuencia:** `0 2 * * *` - Diario a las 2:00 AM
- **Método:** Full catalog sync
- **Ventajas:** Simple, asegura consistencia total
- **Desventajas:** Lento si hay muchos productos (>10,000)

**Opción B: Scheduled Incremental Sync (Recomendado para producción)**
- **Tipo:** Cron Schedule
- **Frecuencia:** `0 */4 * * *` - Cada 4 horas
- **Método:** Solo productos actualizados desde última sincronización
- **Query BIND:** `GET /products?updated_since={{last_sync_timestamp}}`
- **Ventajas:** Rápido, eficiente
- **Desventajas:** Requiere timestamp tracking

**Opción C: Webhook desde BIND (Ideal pero requiere configuración en BIND)**
- **Tipo:** Webhook
- **Trigger:** BIND envía webhook cuando se actualiza un producto
- **Ventajas:** Tiempo real, zero overhead
- **Desventajas:** Requiere configuración en BIND (puede no estar disponible)

**🎯 Decisión Recomendada:**
- **MVP:** Opción A (Full Sync diario)
- **Producción:** Opción B (Incremental cada 4 horas)

#### 🔍 Fuente de Datos

**API BIND - Full Sync:**
```
GET https://api.bind.com.mx/v1/products?company_id={{bind_client_id}}
```

**Response:**
```json
{
  "success": true,
  "total": 1234,
  "page": 1,
  "per_page": 100,
  "products": [
    {
      "bind_id": "PROD-12345",
      "sku": "CEM-50-GR",
      "name": "Cemento Gris 50kg",
      "description": "Cemento portland gris, presentación 50kg",
      "price": 280.00,
      "stock": 150,
      "unit": "pza",
      "category": "Construcción",
      "subcategory": "Cementos",
      "image_url": "https://cdn.bind.com.mx/products/cem-50-gr.jpg",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2025-11-05T08:30:00Z",
      "metadata": {
        "weight_kg": 50,
        "brand": "Cemex",
        "min_order_quantity": 10
      }
    }
  ]
}
```

**API BIND - Incremental Sync:**
```
GET https://api.bind.com.mx/v1/products?company_id={{bind_client_id}}&updated_since=2025-11-05T00:00:00Z
```

#### ⚙️ Nodos del Workflow

```
[1. Schedule Trigger: Daily 2am]
      │
      ▼
[2. Get Last Sync Timestamp]
      │
      ▼
[3. HTTP Request: GET BIND Products]
      │
      ▼
[4. Loop: Paginate all pages]
      │
      ▼
[5. Split Into Items]
      │
      ▼
[6. Function: Transform BIND → Supabase]
      │
      ▼
[7. Postgres: UPSERT Product]
      │
      ├─── SUCCESS ──▶ [8. Count success]
      │
      └─── ERROR ──▶ [9. Log error]
                        │
                        ▼
                  [10. Continue with next]
      │
      ▼
[11. Update Last Sync Timestamp]
      │
      ▼
[12. Summary Notification]
```

#### 🔧 Configuración de Nodos

**Nodo 2: Get Last Sync Timestamp**
```sql
SELECT
  MAX(bind_last_synced_at) as last_sync,
  COUNT(*) as total_products
FROM products
WHERE bind_sync_enabled = true;
```

**Nodo 3: HTTP Request (with pagination)**
```javascript
// Function Node: Fetch all pages
const results = [];
let page = 1;
let hasMore = true;
const perPage = 100;

while (hasMore) {
  const response = await fetch(
    `${$env.BIND_API_URL}/products?company_id=${$json.bind_client_id}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        'Authorization': `Bearer ${$env.BIND_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  results.push(...data.products);

  hasMore = data.products.length === perPage;
  page++;

  // Safety: max 100 pages
  if (page > 100) break;
}

return {
  json: {
    products: results,
    total_fetched: results.length,
    pages_fetched: page - 1
  }
};
```

**Nodo 6: Transform to Supabase Format**
```javascript
const bindProduct = $input.item.json;

return {
  json: {
    company_id: $env.COMPANY_ID, // From workflow context
    bind_id: bindProduct.bind_id,
    sku: bindProduct.sku,
    name: bindProduct.name,
    description: bindProduct.description || null,
    price: parseFloat(bindProduct.price),
    stock: parseInt(bindProduct.stock),
    unit: bindProduct.unit || 'pza',
    category: bindProduct.category || null,
    image_url: bindProduct.image_url || null,
    is_active: bindProduct.is_active !== false,
    bind_last_synced_at: new Date().toISOString()
  }
};
```

**Nodo 7: Postgres UPSERT**
```sql
INSERT INTO products (
  company_id,
  bind_id,
  sku,
  name,
  description,
  price,
  stock,
  unit,
  category,
  image_url,
  is_active,
  bind_last_synced_at,
  bind_sync_enabled
) VALUES (
  '{{$json.company_id}}',
  '{{$json.bind_id}}',
  '{{$json.sku}}',
  '{{$json.name}}',
  '{{$json.description}}',
  {{$json.price}},
  {{$json.stock}},
  '{{$json.unit}}',
  '{{$json.category}}',
  '{{$json.image_url}}',
  {{$json.is_active}},
  NOW(),
  true
)
ON CONFLICT (company_id, bind_id)
DO UPDATE SET
  sku = EXCLUDED.sku,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  unit = EXCLUDED.unit,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  bind_last_synced_at = NOW(),
  updated_at = NOW();
```

**Nodo 11: Update Sync Timestamp**
```sql
-- Store last sync in a metadata table
INSERT INTO sync_metadata (
  sync_type,
  last_sync_at,
  items_synced,
  status
) VALUES (
  'products_from_bind',
  NOW(),
  {{$json.total_synced}},
  'success'
);
```

**Nodo 12: Summary Notification**
```javascript
// Function Node: Generate summary
const summary = {
  workflow: 'WF-03 Products Sync',
  execution_id: $execution.id,
  started_at: $execution.startedAt,
  finished_at: new Date().toISOString(),
  results: {
    total_fetched: $json.total_fetched,
    products_created: $json.created_count,
    products_updated: $json.updated_count,
    products_failed: $json.failed_count,
    errors: $json.errors || []
  }
};

// Send to Slack or Email
return { json: summary };
```

#### 🚨 Manejo de Errores

**Error: Producto duplicado (mismo SKU, diferente bind_id)**
```sql
-- Conflict resolution strategy
-- Opción 1: Mantener el primero
ON CONFLICT (company_id, sku) DO NOTHING;

-- Opción 2: Agregar sufijo al SKU
-- name → name + " (BIND-" + bind_id + ")"
```

**Error: Stock negativo desde BIND**
```javascript
// Validar antes de insertar
if (bindProduct.stock < 0) {
  console.warn(`Product ${bindProduct.sku} has negative stock: ${bindProduct.stock}`);
  bindProduct.stock = 0; // Forzar a 0
}
```

---

### WF-04: Sincronización de Inventario BIND → Supabase

**Objetivo:** Actualizar solo el stock de productos existentes desde BIND.

**Prioridad:** 🟡 Media
**Complejidad:** 🟢 Baja
**Estado:** ⏳ Pendiente

**Diferencia con WF-03:**
- WF-03 sincroniza TODO el catálogo (productos completos)
- WF-04 sincroniza SOLO los niveles de stock (más rápido)

#### 📊 Estrategia de Trigger

**Recomendado:** Scheduled - Cada 1 hora
- **Cron:** `0 * * * *`
- **Método:** Incremental (solo productos con stock_updated_at reciente)

#### 🔍 Fuente de Datos

**API BIND:**
```
GET https://api.bind.com.mx/v1/inventory?company_id={{bind_client_id}}&updated_since={{last_sync}}
```

**Response:**
```json
{
  "success": true,
  "inventory": [
    {
      "bind_id": "PROD-12345",
      "sku": "CEM-50-GR",
      "stock": 145,
      "updated_at": "2025-11-05T14:30:00Z"
    }
  ]
}
```

#### ⚙️ Nodos del Workflow

```
[1. Schedule: Hourly]
  │
  ▼
[2. Get Last Inventory Sync]
  │
  ▼
[3. HTTP: GET BIND Inventory]
  │
  ▼
[4. Split Items]
  │
  ▼
[5. Postgres: UPDATE stock only]
  │
  ▼
[6. Log sync]
```

**Nodo 5: Update Stock**
```sql
UPDATE products
SET
  stock = {{$json.stock}},
  bind_last_synced_at = NOW(),
  updated_at = NOW()
WHERE
  company_id = '{{$json.company_id}}'
  AND bind_id = '{{$json.bind_id}}';
```

---

### WF-05: Notificaciones de Requisiciones

**Objetivo:** Enviar notificaciones a usuarios relevantes cuando hay cambios de estado en requisiciones.

**Prioridad:** 🟡 Media
**Complejidad:** 🟢 Baja
**Estado:** ⏳ Pendiente

#### 📊 Eventos que Disparan Notificaciones

1. **Requisición creada** → Notificar a supervisor del proyecto
2. **Requisición aprobada** → Notificar al creador
3. **Requisición rechazada** → Notificar al creador + razón
4. **Requisición sincronizada con BIND** → Notificar al creador + supervisor
5. **Error en sincronización** → Notificar a admins

#### 📊 Estrategia de Trigger

**Opción A: Database Trigger + Webhook (Recomendado)**
```sql
CREATE OR REPLACE FUNCTION notify_n8n_requisition_status_change()
RETURNS trigger AS $$
BEGIN
  -- Solo si cambió el business_status
  IF NEW.business_status IS DISTINCT FROM OLD.business_status THEN
    PERFORM net.http_post(
      url := 'https://n8n.tu-dominio.com/webhook/requisition-status-changed',
      body := jsonb_build_object(
        'event_type', 'requisition_status_changed',
        'requisition_id', NEW.id,
        'old_status', OLD.business_status,
        'new_status', NEW.business_status,
        'created_by', NEW.created_by,
        'approved_by', NEW.approved_by,
        'rejected_at', NEW.rejected_at,
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;
```

**Opción B: Scheduled Poll (Alternativa)**
- **Cron:** `*/5 * * * *` - Cada 5 minutos
- **Query:** Buscar cambios en los últimos 5 minutos

#### ⚙️ Nodos del Workflow

```
[1. Webhook Trigger]
      │
      ▼
[2. Get User Info (created_by, approved_by)]
      │
      ▼
[3. Switch: By status]
      │
      ├─── 'approved' ──▶ [4A. Email: Requisición Aprobada]
      │
      ├─── 'rejected' ──▶ [4B. Email: Requisición Rechazada]
      │
      └─── 'ordered' ───▶ [4C. Email: Orden Enviada a BIND]
      │
      ▼
[5. Create in-app notification]
      │
      ▼
[6. Log notification sent]
```

**Nodo 4A: Email Template - Aprobada**
```html
<h2>✅ Requisición Aprobada</h2>
<p>Hola {{$json.creator_name}},</p>
<p>Tu requisición <strong>{{$json.internal_folio}}</strong> ha sido aprobada.</p>
<ul>
  <li><strong>Proyecto:</strong> {{$json.project_name}}</li>
  <li><strong>Monto Total:</strong> ${{$json.total_amount}}</li>
  <li><strong>Aprobada por:</strong> {{$json.approver_name}}</li>
  <li><strong>Fecha:</strong> {{$json.approved_at}}</li>
</ul>
<p>La orden será enviada a BIND en los próximos 15 minutos.</p>
<a href="https://app.comereco.com/requisitions/{{$json.requisition_id}}">Ver Detalles</a>
```

**Nodo 5: Create In-App Notification**
```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  link,
  metadata
) VALUES (
  '{{$json.created_by}}',
  'requisition_approved',
  'Requisición Aprobada',
  'Tu requisición {{$json.internal_folio}} ha sido aprobada',
  '/requisitions/{{$json.requisition_id}}',
  '{"requisition_id": "{{$json.requisition_id}}", "status": "approved"}'::jsonb
);
```

---

### WF-06: Retry de Sincronizaciones Fallidas

**Objetivo:** Reintentar automáticamente sincronizaciones que fallaron.

**Prioridad:** 🟡 Media
**Complejidad:** 🟡 Media
**Estado:** ⏳ Pendiente

#### 📊 Estrategia de Trigger

**Scheduled:** `0 */2 * * *` - Cada 2 horas

#### 🔍 Fuente de Datos

```sql
SELECT
  id,
  internal_folio,
  company_id,
  bind_error_message,
  bind_sync_attempts,
  approved_at
FROM requisitions
WHERE
  business_status = 'approved'
  AND integration_status = 'sync_failed'
  AND bind_sync_attempts < 3
  AND approved_at > NOW() - INTERVAL '7 days'  -- Solo últimos 7 días
ORDER BY approved_at DESC;
```

#### ⚙️ Nodos del Workflow

```
[1. Schedule: Every 2 hours]
  │
  ▼
[2. Query: Get failed syncs]
  │
  ▼
[3. Loop: For each]
  │
  ▼
[4. Re-trigger WF-02]
  │
  ├─── Success ──▶ [5. Update status]
  │
  └─── Fail ───▶ [6. Increment attempts]
                    │
                    ▼
                 [7. If attempts >= 3]
                    │
                    ▼
                 [8. Alert admin]
```

---

## 📅 Roadmap de Implementación

### Fase 1: MVP (Semanas 1-2)
**Objetivo:** Funcionalidad básica con scheduled triggers

**Workflows:**
- ✅ WF-01: Stock Monitoring (Scheduled)
- ✅ WF-02: Requisition Sync (Scheduled)
- ✅ WF-03: Products Sync (Scheduled)

**Tareas:**
1. ✅ Configurar n8n en VPS
2. ✅ Configurar credentials (Supabase, BIND, SMTP)
3. ✅ Implementar WF-01 (versión scheduled)
4. ✅ Implementar WF-02 (versión scheduled)
5. ✅ Implementar WF-03 (full sync)
6. ✅ Testing básico
7. ✅ Documentar APIs de BIND

**Entregables:**
- Workflows funcionando con scheduled triggers
- Logs básicos en Supabase
- Notificaciones por email

---

### Fase 2: Optimización (Semanas 3-4)
**Objetivo:** Tiempo real y optimizaciones

**Workflows:**
- ✅ WF-02: Migrate to webhook trigger
- ✅ WF-03: Incremental sync
- ✅ WF-04: Inventory-only sync
- ✅ WF-05: Notifications

**Tareas:**
1. Implementar triggers en Supabase con net.http_post
2. Configurar webhooks seguros en n8n
3. Optimizar WF-03 para sync incremental
4. Implementar WF-04 (inventory)
5. Implementar WF-05 (notifications)
6. Agregar retry logic

**Entregables:**
- Sincronización en tiempo real
- Notificaciones in-app
- Retry automático

---

### Fase 3: Monitoreo y Escalabilidad (Semana 5+)
**Objetivo:** Producción-ready

**Workflows:**
- ✅ WF-06: Retry failed syncs
- ✅ WF-07: Health checks
- ✅ WF-08: Analytics dashboard

**Tareas:**
1. Implementar health checks
2. Dashboard de métricas en Grafana/Metabase
3. Alertas a Slack
4. Rate limiting para BIND API
5. Logging estructurado
6. Backup de workflows

**Entregables:**
- Sistema monitoreado 24/7
- Alertas automáticas
- Analytics dashboard

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Autenticación y Credenciales

**n8n Credentials Storage:**
```bash
# Variables de entorno (NO hardcodear)
SUPABASE_DB_HOST=aws-1-us-east-2.pooler.supabase.com
SUPABASE_DB_PASSWORD=VicmaBigez2405.
BIND_API_TOKEN=***
SMTP_PASSWORD=***
```

**Supabase RLS:**
- Todos los workflows deben usar `service_role` key con cuidado
- NUNCA exponer `service_role` al frontend
- Usar `anon` key solo para operaciones públicas

**BIND API:**
- Rotar tokens cada 90 días
- Rate limiting: Max 100 req/min
- Usar request IDs para debugging

---

### 2. Manejo de Errores

**Estrategia General:**
```javascript
try {
  // Operación
} catch (error) {
  // 1. Log el error
  await logError({
    workflow: 'WF-02',
    error: error.message,
    context: { requisition_id }
  });

  // 2. Decidir: retry o fail
  if (isRetryable(error)) {
    return { retry: true, after: 60 };
  }

  // 3. Notificar si es crítico
  if (isCritical(error)) {
    await notifyAdmin(error);
  }

  // 4. Actualizar estado en DB
  await updateStatus('failed');
}
```

**Errores Retryables:**
- Network timeout
- BIND API rate limit
- Database connection lost

**Errores NO Retryables:**
- Invalid data format
- Product not found
- Unauthorized

---

### 3. Rate Limiting

**BIND API Limits:**
- Max 100 requests/minute
- Max 1000 requests/hour

**Estrategia:**
```javascript
// En Function Node
const RATE_LIMIT = 100; // per minute
const BATCH_SIZE = 10;
const DELAY_MS = (60 / RATE_LIMIT) * 1000 * BATCH_SIZE;

// Process in batches
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);

  // Wait between batches
  if (i + BATCH_SIZE < items.length) {
    await sleep(DELAY_MS);
  }
}
```

---

### 4. Idempotencia

**Principio:** Un workflow ejecutado múltiples veces con los mismos datos debe producir el mismo resultado.

**Ejemplo:**
```sql
-- MALO: Puede crear duplicados
INSERT INTO requisitions (internal_folio, ...) VALUES ('REQ-001', ...);

-- BUENO: Idempotente
INSERT INTO requisitions (internal_folio, ...)
VALUES ('REQ-001', ...)
ON CONFLICT (internal_folio) DO UPDATE
SET updated_at = NOW();
```

**Request IDs:**
```javascript
// Agregar request ID único
headers: {
  'X-Request-ID': `${execution.id}-${item.id}`,
  'X-Idempotency-Key': generateIdempotencyKey()
}
```

---

## 📊 Monitoreo y Alertas

### 1. Métricas Clave (KPIs)

**WF-01: Stock Monitoring**
- Productos en estado CRITICAL/HIGH/MEDIUM
- Requisiciones creadas automáticamente (count)
- Tiempo de respuesta (avg)
- Tasa de éxito (%)

**WF-02: Requisition Sync**
- Requisiciones sincronizadas (count)
- Tasa de éxito de sincronización (%)
- Tiempo promedio de sincronización (ms)
- Requisiciones fallidas > 3 intentos

**WF-03: Products Sync**
- Productos sincronizados (count)
- Productos nuevos vs actualizados
- Duración del sync (minutes)
- Errores de formato (count)

### 2. Logging Estructurado

**Tabla de Logs:**
```sql
CREATE TABLE workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  items_processed INTEGER DEFAULT 0,
  items_success INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_execution_logs_workflow ON workflow_execution_logs(workflow_name, created_at DESC);
CREATE INDEX idx_workflow_execution_logs_status ON workflow_execution_logs(status) WHERE status IN ('failed', 'running');
```

**Insertar en cada ejecución:**
```sql
INSERT INTO workflow_execution_logs (
  workflow_name,
  execution_id,
  started_at,
  finished_at,
  status,
  items_processed,
  items_success,
  items_failed,
  metadata
) VALUES (
  'WF-02-requisition-sync',
  '{{$execution.id}}',
  '{{$execution.startedAt}}',
  NOW(),
  'success',
  10,
  9,
  1,
  '{"avg_duration_ms": 2340, "bind_api_calls": 10}'::jsonb
);
```

### 3. Alertas

**Configuración de Alertas:**

**Alerta 1: Workflow Failed**
```yaml
trigger: workflow_execution_logs.status = 'failed'
frequency: immediate
channels: [email, slack]
recipients: [admin@comereco.com, #dev-alerts]
```

**Alerta 2: Requisition Sync Backlog**
```sql
-- Si hay más de 20 requisiciones pendientes por más de 1 hora
SELECT COUNT(*) FROM requisitions
WHERE business_status = 'approved'
  AND integration_status = 'pending_sync'
  AND approved_at < NOW() - INTERVAL '1 hour';
```

**Alerta 3: BIND API Down**
```yaml
trigger: 5 consecutive failures in WF-02
frequency: immediate
channels: [sms, slack, email]
recipients: [platform-admin]
```

### 4. Dashboard de Monitoreo

**Crear vista para dashboard:**
```sql
CREATE VIEW workflow_health_dashboard AS
SELECT
  workflow_name,
  DATE(started_at) as execution_date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(AVG(items_processed), 2) as avg_items_processed,
  ROUND(AVG(EXTRACT(EPOCH FROM (finished_at - started_at))), 2) as avg_duration_seconds
FROM workflow_execution_logs
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY workflow_name, DATE(started_at)
ORDER BY execution_date DESC, workflow_name;
```

**Visualizar en Metabase/Grafana:**
- Gráfica de línea: Executions per day
- Gráfica de barras: Success rate %
- Table: Recent failures

---

## 📝 Control de Cambios

### Versión 1.0.0 - 2025-11-05
**Autor:** Claude + bigez
**Cambios:**
- ✅ Documento inicial creado
- ✅ Definidos 6 workflows principales
- ✅ Estrategias de triggers (scheduled vs webhook)
- ✅ Queries SQL para extracción de datos
- ✅ Configuración de nodos n8n
- ✅ Manejo de errores
- ✅ Roadmap de implementación
- ✅ Seguridad y mejores prácticas
- ✅ Monitoreo y alertas

**Próximos Pasos:**
1. Revisar con equipo de desarrollo
2. Validar endpoints de BIND API
3. Crear usuario de sistema para n8n en Supabase
4. Implementar Fase 1 (MVP)

---

## 🔗 Referencias

**Documentación Relacionada:**
- [SETUP.md](./SETUP.md) - Guía de instalación de n8n
- [SECURITY_FIXES_APPLIED.md](../../../docs/SECURITY_FIXES_APPLIED.md) - Seguridad de DB
- [INVENTORY_RESTOCK_MONITORING.md](../../../docs/INVENTORY_RESTOCK_MONITORING.md) - Sistema de restock

**APIs Externas:**
- BIND ERP API Documentation: `https://docs.bind.com.mx/api/v1`
- n8n Documentation: `https://docs.n8n.io`
- Supabase Documentation: `https://supabase.com/docs`

**Contactos:**
- BIND API Support: soporte@bind.com.mx
- Platform Admin: admin@comereco.com

---

**Estado del Documento:** 🔵 En Planificación
**Última Actualización:** 2025-11-05
**Mantenido por:** Equipo de Desarrollo COMERECO
