# ✅ MEJORAS APLICADAS A SUPABASE PARA N8N

**Fecha:** 2025-01-31  
**Estado:** ✅ **COMPLETADO** - Todas las mejoras aplicadas exitosamente

---

## 📊 RESUMEN DE MEJORAS

Se aplicaron **2 migraciones completas** que mejoran significativamente la capacidad de Supabase para integrarse con n8n y Bind ERP:

### Migración 1: Adaptación Base para n8n ✅
- Campos adicionales en `requisitions`
- Función `get_requisition_for_bind()`
- Función `update_bind_sync_status()`
- Vista `requisitions_pending_sync`

### Migración 2: Mejoras Completas ✅
- Tabla `bind_mappings` para mapeos
- Tabla `bind_sync_logs` para auditoría
- Funciones para sincronización de productos
- Funciones helper adicionales
- Vistas optimizadas

---

## 🆕 NUEVAS TABLAS

### 1. `bind_mappings`
**Propósito:** Mapear entidades de Supabase a IDs de Bind ERP

**Campos:**
- `id` (UUID)
- `company_id` (UUID) - FK a companies
- `mapping_type` (TEXT) - 'client', 'product', 'location', 'warehouse', 'branch'
- `supabase_id` (UUID) - ID de la entidad en Supabase
- `bind_id` (TEXT) - ID correspondiente en Bind ERP
- `bind_data` (JSONB) - Datos adicionales de Bind
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

**Uso:** Configurar mappings de clientes, productos, ubicaciones, etc.

---

### 2. `bind_sync_logs`
**Propósito:** Auditoría de todas las sincronizaciones con Bind ERP

**Campos:**
- `id` (UUID)
- `company_id` (UUID)
- `sync_type` (TEXT) - 'products', 'requisition', 'manual'
- `entity_type` (TEXT) - 'product', 'requisition', etc.
- `entity_id` (UUID) - ID de la entidad sincronizada
- `bind_id` (TEXT) - ID en Bind ERP
- `status` (TEXT) - 'success', 'failed', 'pending'
- `request_payload` (JSONB) - Datos enviados
- `response_payload` (JSONB) - Respuesta recibida
- `error_message` (TEXT)
- `synced_at`, `created_at` (TIMESTAMP)

**Uso:** Logs completos para debugging y auditoría

---

## 🔧 FUNCIONES NUEVAS Y MEJORADAS

### Funciones para Requisiciones

#### `get_requisition_for_bind(requisition_id)`
**Retorna:** JSON completo con toda la información estructurada

```sql
SELECT public.get_requisition_for_bind('[requisition_id]');
```

**Contiene:**
- Información de requisición
- Información de empresa
- Información de proyecto
- Información de solicitante
- Información de aprobador
- Items con productos completos

---

#### `update_bind_sync_status(requisition_id, bind_folio, success, error_message)`
**Propósito:** Actualizar estado después de sincronizar con Bind

```sql
-- Éxito
SELECT public.update_bind_sync_status(
    '[requisition_id]',
    'PO-2025-1234',
    true,
    NULL
);

-- Error
SELECT public.update_bind_sync_status(
    '[requisition_id]',
    NULL,
    false,
    'Error al conectar con Bind API'
);
```

---

#### `validate_requisition_for_bind(requisition_id)`
**Propósito:** Validar que una requisición tenga toda la info necesaria

```sql
SELECT public.validate_requisition_for_bind('[requisition_id]');
```

**Retorna:**
```json
{
  "valid": true,
  "requisition_id": "uuid",
  "items_count": 5,
  "missing_bind_ids": 0,
  "warnings": []
}
```

---

### Funciones para Productos

#### `upsert_product_from_bind(company_id, product_data)`
**Propósito:** Crear o actualizar producto desde datos de Bind

```sql
SELECT public.upsert_product_from_bind(
    '[company_id]',
    '{
      "bind_id": "PROD-123",
      "name": "Cloro Industrial 5L",
      "price": 120.00,
      "stock": 45,
      "category": "Limpieza",
      "sku": "CLO-5L-001",
      "unit": "pieza",
      "is_active": true
    }'::jsonb
);
```

---

#### `batch_upsert_products_from_bind(company_id, products_array)`
**Propósito:** Procesar múltiples productos en una transacción

```sql
SELECT public.batch_upsert_products_from_bind(
    '[company_id]',
    '[
      {"bind_id": "PROD-1", "name": "Producto 1", "price": 100},
      {"bind_id": "PROD-2", "name": "Producto 2", "price": 200}
    ]'::jsonb
);
```

**Retorna:**
```json
{
  "total": 2,
  "success": 2,
  "errors": 0,
  "error_details": []
}
```

---

#### `get_products_pending_sync(company_id, limit)`
**Propósito:** Obtener productos que necesitan sincronización

```sql
SELECT * FROM public.get_products_pending_sync('[company_id]', 100);
```

---

### Funciones para Mappings

#### `get_bind_client_id(company_id)`
**Mejorada:** Ahora consulta `bind_mappings` primero

```sql
SELECT public.get_bind_client_id('[company_id]');
```

---

#### `get_bind_branch_id(project_id)`
**Mejorada:** Consulta `bind_mappings` primero, luego `companies.bind_location_id`

```sql
SELECT public.get_bind_branch_id('[project_id]');
```

---

#### `get_bind_product_id(product_id)`
**Funcionalidad:** Obtiene bind_id de un producto

```sql
SELECT public.get_bind_product_id('[product_id]');
```

---

### Funciones para Estadísticas y Resúmenes

#### `get_bind_sync_stats(company_id, days)`
**Propósito:** Estadísticas de sincronización

```sql
SELECT public.get_bind_sync_stats('[company_id]', 7);
```

**Retorna:**
```json
{
  "total_syncs": 150,
  "successful_syncs": 145,
  "failed_syncs": 5,
  "pending_syncs": 0,
  "syncs_by_type": {
    "products": 100,
    "requisition": 50
  },
  "last_successful_sync": "2025-01-31T10:00:00Z",
  "last_failed_sync": "2025-01-30T15:30:00Z"
}
```

---

#### `get_company_sync_summary(company_id)`
**Propósito:** Resumen completo del estado de sincronización

```sql
SELECT public.get_company_sync_summary('[company_id]');
```

**Retorna:**
```json
{
  "company_id": "uuid",
  "requisitions": {
    "total": 50,
    "pending_sync": 5,
    "synced": 43,
    "failed": 2
  },
  "products": {
    "total": 200,
    "with_bind_id": 180,
    "pending_sync": 20
  },
  "last_sync": "2025-01-31T10:00:00Z"
}
```

---

#### `get_company_bind_info(company_id)`
**Propósito:** Obtener toda la configuración de Bind de una empresa

```sql
SELECT public.get_company_bind_info('[company_id]');
```

---

### Funciones para Logging

#### `log_bind_sync(...)`
**Propósito:** Registrar logs de sincronización

```sql
SELECT public.log_bind_sync(
    '[company_id]',
    'requisition',
    'requisition',
    '[requisition_id]',
    'PO-2025-1234',
    'success',
    '{"request": "data"}'::jsonb,
    '{"response": "data"}'::jsonb,
    NULL
);
```

---

## 📊 NUEVAS VISTAS

### 1. `requisitions_pending_sync`
**Propósito:** Requisiciones aprobadas pendientes de sincronizar

```sql
SELECT * FROM public.requisitions_pending_sync LIMIT 10;
```

**Campos:** id, internal_folio, company_id, project_id, total_amount, approved_at, company_name, bind_location_id, requester_name, approver_name

---

### 2. `products_pending_sync`
**Propósito:** Productos que necesitan sincronización

```sql
SELECT * FROM public.products_pending_sync WHERE company_id = '[company_id]';
```

**Campos:** id, company_id, bind_id, name, sku, price, stock, category, bind_last_synced_at, company_name, sync_status

**sync_status:** 'never', 'stale', 'current'

---

## 🔍 CAMPOS AGREGADOS

### Tabla `requisitions`
- ✅ `bind_folio` (TEXT) - Folio de Bind ERP
- ✅ `bind_synced_at` (TIMESTAMP) - Fecha de sincronización
- ✅ `bind_error_message` (TEXT) - Mensaje de error
- ✅ `bind_sync_attempts` (INTEGER) - Contador de reintentos
- ✅ `approved_at` (TIMESTAMP) - Fecha de aprobación

### Tabla `products`
- ✅ `bind_sync_enabled` (BOOLEAN) - Control de sincronización automática

---

## 📈 ÍNDICES CREADOS

### Para `requisitions`
- `idx_requisitions_bind_folio` - Búsqueda por folio
- `idx_requisitions_pending_sync` - Optimización para webhooks
- `idx_requisitions_approved_at` - Búsqueda por fecha de aprobación

### Para `bind_mappings`
- `idx_bind_mappings_company_type` - Búsqueda por empresa y tipo
- `idx_bind_mappings_supabase_id` - Búsqueda por ID de Supabase
- `idx_bind_mappings_bind_id` - Búsqueda por ID de Bind
- `idx_bind_mappings_active` - Solo mappings activos

### Para `bind_sync_logs`
- `idx_bind_sync_logs_company_type` - Búsqueda por empresa y tipo
- `idx_bind_sync_logs_status` - Búsqueda por estado
- `idx_bind_sync_logs_synced_at` - Ordenamiento por fecha
- `idx_bind_sync_logs_entity` - Búsqueda por entidad

### Para `products`
- `idx_products_company_bind_id` - Único por empresa y bind_id

---

## 🎯 CASOS DE USO PARA N8N

### 1. Detectar Requisición Aprobada

**Opción A: Webhook de Supabase**
- Configurar webhook en Supabase para cambios en `requisitions`
- Filtrar: `business_status = 'approved' AND integration_status = 'pending_sync'`
- n8n recibe evento y llama a `get_requisition_for_bind()`

**Opción B: Polling**
- Consultar `requisitions_pending_sync` cada 5 minutos
- Para cada una, llamar a `get_requisition_for_bind()`

---

### 2. Sincronizar Productos

**Opción A: Batch desde Bind**
- Obtener productos de Bind API
- Llamar a `batch_upsert_products_from_bind()` con array completo

**Opción B: Individual**
- Para cada producto de Bind, llamar a `upsert_product_from_bind()`

**Consultar pendientes:**
- Llamar a `get_products_pending_sync()` para ver qué necesita sincronización

---

### 3. Validar Antes de Procesar

```sql
-- En n8n, antes de crear pedido en Bind:
SELECT public.validate_requisition_for_bind('[requisition_id]');
-- Si valid = false, reportar error y no procesar
```

---

### 4. Actualizar Estado Después de Procesar

```sql
-- Si Bind responde éxito:
SELECT public.update_bind_sync_status(
    '[requisition_id]',
    '[bind_folio]',
    true,
    NULL
);

-- Si Bind responde error:
SELECT public.update_bind_sync_status(
    '[requisition_id]',
    NULL,
    false,
    '[error_message]'
);
```

---

### 5. Obtener Estadísticas

```sql
-- Dashboard de sincronización:
SELECT public.get_bind_sync_stats('[company_id]', 7);
SELECT public.get_company_sync_summary('[company_id]');
```

---

## 🎯 RESULTADO FINAL

### ✅ Lo que ahora es posible:

1. **Obtener información completa de requisición** en una sola llamada
2. **Sincronizar productos** desde Bind fácilmente (batch o individual)
3. **Validar requisiciones** antes de procesar
4. **Actualizar estados** después de sincronizar
5. **Auditar todas las sincronizaciones** con logs completos
6. **Configurar mappings** de entidades Supabase → Bind
7. **Obtener estadísticas** de sincronización
8. **Consultar pendientes** fácilmente con vistas optimizadas

### ✅ Estructura optimizada para n8n:

- **Una sola llamada** obtiene toda la información necesaria
- **Funciones helper** facilitan operaciones comunes
- **Vistas optimizadas** para consultas frecuentes
- **Logs completos** para debugging
- **Validaciones** antes de procesar
- **Índices** para performance

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `docs/ADAPTACION_SUPABASE_PARA_N8N.md` - Guía completa de adaptación
- `docs/GUIA_N8N_CONSUMO_SUPABASE.md` - Guía para usar desde n8n
- `docs/api/MIGRACION_ADAPTACION_N8N.sql` - Migración 1
- `docs/api/MIGRACION_MEJORAS_COMPLETAS.sql` - Migración 2

---

**Estado:** ✅ **COMPLETADO**  
**Fecha:** 2025-01-31  
**Próximo paso:** Configurar workflows en n8n usando estas funciones

