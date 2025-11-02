# 🔧 ADAPTACIÓN DE SUPABASE PARA INTEGRACIÓN CON N8N

**Fecha:** 2025-01-31  
**Objetivo:** Asegurar que la estructura de Supabase facilite obtener toda la información necesaria mediante webhooks para n8n

---

## 🎯 PROPÓSITO

Adaptar la estructura de Supabase para que cuando n8n reciba un webhook (por ejemplo, cuando se aprueba una requisición), pueda obtener **fácilmente** toda la información necesaria para crear un pedido en Bind ERP en **una sola consulta estructurada**.

---

## 📋 REQUISITOS PARA N8N

Cuando n8n reciba un webhook de Supabase indicando que una requisición fue aprobada, necesita obtener:

1. **Información de la requisición:**
   - ID, folio interno, total, comentarios
   - Estado de negocio y de integración
   - Fechas de creación y aprobación

2. **Información del cliente (empresa):**
   - Company ID
   - Bind Client ID (si existe)
   - Bind Location ID
   - Bind Price List ID

3. **Información del proyecto:**
   - Project ID
   - Nombre del proyecto
   - Bind Branch ID (si existe mapping)

4. **Información del solicitante:**
   - User ID y nombre
   - Información de contacto (si existe)

5. **Información del aprobador:**
   - User ID y nombre
   - Rol del aprobador

6. **Items de la requisición:**
   - Product ID
   - Bind Product ID (si existe)
   - Cantidad
   - Precio unitario
   - Subtotal
   - Nombre del producto
   - SKU del producto

7. **Campos para almacenar respuesta de Bind:**
   - Bind Folio (para guardar el folio que retorna Bind)
   - Bind Synced At (fecha de sincronización)
   - Bind Error Message (si falla)

---

## 🔍 ANÁLISIS DE LA ESTRUCTURA ACTUAL

### ✅ Lo que ya existe:

**Tabla `requisitions`:**
- ✅ `id`, `company_id`, `project_id`
- ✅ `internal_folio`, `total_amount`, `comments`
- ✅ `business_status`, `integration_status`
- ✅ `created_by`, `approved_by`
- ✅ `created_at`, `updated_at`
- ✅ `items` JSONB (pero mejor usar `requisition_items` normalizada)
- ✅ `bind_order_id`, `bind_status`, `bind_rejection_reason` (existen pero necesitan ajustes)

**Tabla `requisition_items`:**
- ✅ `requisition_id`, `product_id`
- ✅ `quantity`, `unit_price`, `subtotal`

**Tabla `products`:**
- ✅ `id`, `bind_id`, `name`, `sku`, `price`

**Tabla `companies`:**
- ✅ `id`, `bind_location_id`, `bind_price_list_id`

**Tabla `projects`:**
- ✅ `id`, `name`, `company_id`

---

## ❌ Lo que falta o necesita ajuste:

1. ❌ Campo `bind_folio` en `requisitions` (actualmente solo hay `bind_order_id`)
2. ❌ Campo `bind_synced_at` para saber cuándo se sincronizó
3. ❌ Campo `bind_error_message` para errores de sincronización
4. ❌ Campo `bind_sync_attempts` para contar reintentos
5. ❌ Función RPC que devuelva toda la información estructurada en un solo JSON
6. ❌ Vista o función que facilite obtener información completa con joins

---

## 🚀 CAMBIOS NECESARIOS EN BASE DE DATOS

### 1. Agregar campos faltantes a `requisitions`

```sql
-- Migration: add_bind_integration_fields_to_requisitions
ALTER TABLE public.requisitions
ADD COLUMN IF NOT EXISTS bind_folio TEXT,
ADD COLUMN IF NOT EXISTS bind_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bind_error_message TEXT,
ADD COLUMN IF NOT EXISTS bind_sync_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Índice para búsquedas por folio de Bind
CREATE INDEX IF NOT EXISTS idx_requisitions_bind_folio 
ON public.requisitions(bind_folio) 
WHERE bind_folio IS NOT NULL;

-- Índice para webhooks de n8n (buscar requisiciones pendientes de sincronizar)
CREATE INDEX IF NOT EXISTS idx_requisitions_pending_sync 
ON public.requisitions(business_status, integration_status) 
WHERE business_status = 'approved' AND integration_status = 'pending_sync';

-- Comentarios para documentación
COMMENT ON COLUMN public.requisitions.bind_folio IS 'Folio retornado por Bind ERP cuando se crea el pedido';
COMMENT ON COLUMN public.requisitions.bind_synced_at IS 'Fecha y hora en que se sincronizó exitosamente con Bind ERP';
COMMENT ON COLUMN public.requisitions.bind_error_message IS 'Mensaje de error si falla la sincronización con Bind';
COMMENT ON COLUMN public.requisitions.bind_sync_attempts IS 'Número de intentos de sincronización con Bind ERP';
COMMENT ON COLUMN public.requisitions.approved_at IS 'Fecha y hora en que se aprobó la requisición';
```

---

### 2. Actualizar trigger para establecer `approved_at`

```sql
-- Migration: update_approve_requisition_trigger
CREATE OR REPLACE FUNCTION public.approve_requisition(
    p_requisition_id UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Validaciones y lógica existente...
    -- (mantener la lógica actual pero agregar approved_at)
    
    UPDATE public.requisitions
    SET 
        business_status = 'approved',
        integration_status = 'pending_sync', -- IMPORTANTE: Marcar como pendiente de sincronizar
        approved_by = auth.uid(),
        approved_at = NOW(), -- NUEVO
        updated_at = NOW()
    WHERE id = p_requisition_id
      AND business_status = 'submitted';
    
    -- Retornar resultado...
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### 3. Crear función RPC para obtener información completa estructurada

Esta función será la que n8n llame mediante webhook para obtener toda la información necesaria:

```sql
-- Migration: create_function_get_requisition_for_bind
CREATE OR REPLACE FUNCTION public.get_requisition_for_bind(
    p_requisition_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        -- Información de la requisición
        'requisition', jsonb_build_object(
            'id', r.id,
            'internal_folio', r.internal_folio,
            'total_amount', r.total_amount,
            'comments', r.comments,
            'business_status', r.business_status,
            'integration_status', r.integration_status,
            'created_at', r.created_at,
            'updated_at', r.updated_at,
            'approved_at', r.approved_at,
            'bind_folio', r.bind_folio,
            'bind_synced_at', r.bind_synced_at,
            'bind_error_message', r.bind_error_message,
            'bind_sync_attempts', r.bind_sync_attempts
        ),
        
        -- Información del cliente (empresa)
        'company', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'bind_location_id', c.bind_location_id,
            'bind_price_list_id', c.bind_price_list_id
        ),
        
        -- Información del proyecto
        'project', CASE 
            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description
            )
            ELSE NULL
        END,
        
        -- Información del solicitante
        'requester', jsonb_build_object(
            'id', requester.id,
            'full_name', requester.full_name,
            'email', (SELECT email FROM auth.users WHERE id = requester.id)
        ),
        
        -- Información del aprobador
        'approver', CASE 
            WHEN approver.id IS NOT NULL THEN jsonb_build_object(
                'id', approver.id,
                'full_name', approver.full_name,
                'role_v2', approver.role_v2,
                'email', (SELECT email FROM auth.users WHERE id = approver.id)
            )
            ELSE NULL
        END,
        
        -- Items de la requisición con información completa de productos
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ri.id,
                        'product_id', ri.product_id,
                        'bind_product_id', pr.bind_id,
                        'product_name', pr.name,
                        'product_sku', pr.sku,
                        'quantity', ri.quantity,
                        'unit_price', ri.unit_price,
                        'subtotal', ri.subtotal,
                        'unit', pr.unit,
                        'category', pr.category
                    )
                    ORDER BY ri.id
                )
                FROM public.requisition_items ri
                LEFT JOIN public.products pr ON ri.product_id = pr.id
                WHERE ri.requisition_id = r.id
            ),
            '[]'::jsonb
        )
    )
    INTO v_result
    FROM public.requisitions r
    INNER JOIN public.companies c ON r.company_id = c.id
    LEFT JOIN public.projects p ON r.project_id = p.id
    LEFT JOIN public.profiles requester ON r.created_by = requester.id
    LEFT JOIN public.profiles approver ON r.approved_by = approver.id
    WHERE r.id = p_requisition_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Comentario para documentación
COMMENT ON FUNCTION public.get_requisition_for_bind IS 'Obtiene toda la información de una requisición estructurada para integración con Bind ERP. Incluye requisición, empresa, proyecto, solicitante, aprobador e items con productos.';
```

---

### 4. Crear función para actualizar estado después de sincronizar con Bind

```sql
-- Migration: create_function_update_bind_sync_status
CREATE OR REPLACE FUNCTION public.update_bind_sync_status(
    p_requisition_id UUID,
    p_bind_folio TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF p_success THEN
        UPDATE public.requisitions
        SET 
            integration_status = 'synced',
            bind_folio = p_bind_folio,
            bind_synced_at = NOW(),
            bind_error_message = NULL,
            bind_sync_attempts = bind_sync_attempts + 1,
            updated_at = NOW()
        WHERE id = p_requisition_id;
    ELSE
        UPDATE public.requisitions
        SET 
            integration_status = 'sync_failed',
            bind_error_message = p_error_message,
            bind_sync_attempts = bind_sync_attempts + 1,
            updated_at = NOW()
        WHERE id = p_requisition_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentario para documentación
COMMENT ON FUNCTION public.update_bind_sync_status IS 'Actualiza el estado de sincronización de una requisición con Bind ERP después de procesarla en n8n.';
```

---

### 5. Crear vista para facilitar consultas de webhooks

```sql
-- Migration: create_view_requisitions_pending_sync
CREATE OR REPLACE VIEW public.requisitions_pending_sync AS
SELECT 
    r.id,
    r.internal_folio,
    r.company_id,
    r.project_id,
    r.created_by,
    r.approved_by,
    r.total_amount,
    r.business_status,
    r.integration_status,
    r.approved_at,
    r.bind_sync_attempts,
    c.name AS company_name,
    c.bind_location_id,
    c.bind_price_list_id,
    p.name AS project_name,
    requester.full_name AS requester_name,
    approver.full_name AS approver_name
FROM public.requisitions r
INNER JOIN public.companies c ON r.company_id = c.id
LEFT JOIN public.projects p ON r.project_id = p.id
LEFT JOIN public.profiles requester ON r.created_by = requester.id
LEFT JOIN public.profiles approver ON r.approved_by = approver.id
WHERE r.business_status = 'approved'
  AND r.integration_status = 'pending_sync'
ORDER BY r.approved_at ASC;

-- RLS para la vista
ALTER VIEW public.requisitions_pending_sync SET (security_invoker = true);

-- Comentario para documentación
COMMENT ON VIEW public.requisitions_pending_sync IS 'Vista que muestra requisiciones aprobadas que están pendientes de sincronizar con Bind ERP. Útil para webhooks de n8n.';
```

---

### 6. Crear función helper para obtener Bind IDs de mappings

```sql
-- Migration: create_function_get_bind_client_id
CREATE OR REPLACE FUNCTION public.get_bind_client_id(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_bind_client_id TEXT;
BEGIN
    -- Por ahora retornar null, pero preparado para cuando exista tabla bind_mappings
    -- SELECT bind_id INTO v_bind_client_id
    -- FROM public.bind_mappings
    -- WHERE company_id = p_company_id
    --   AND mapping_type = 'client'
    --   AND is_active = true
    -- LIMIT 1;
    
    RETURN v_bind_client_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Migration: create_function_get_bind_product_id
CREATE OR REPLACE FUNCTION public.get_bind_product_id(p_product_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_bind_product_id TEXT;
BEGIN
    SELECT bind_id INTO v_bind_product_id
    FROM public.products
    WHERE id = p_product_id;
    
    RETURN v_bind_product_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

---

## 📊 ESTRUCTURA JSON QUE RETORNARÁ LA FUNCIÓN

Cuando n8n llame a `get_requisition_for_bind(requisition_id)`, recibirá:

```json
{
  "requisition": {
    "id": "uuid",
    "internal_folio": "REQ-2025-0001",
    "total_amount": 11600.00,
    "comments": "Material para limpieza mensual",
    "business_status": "approved",
    "integration_status": "pending_sync",
    "created_at": "2025-01-31T10:00:00Z",
    "approved_at": "2025-01-31T10:05:00Z",
    "bind_folio": null,
    "bind_synced_at": null,
    "bind_error_message": null,
    "bind_sync_attempts": 0
  },
  "company": {
    "id": "uuid",
    "name": "Soluciones a la Orden",
    "bind_location_id": "LOC-123",
    "bind_price_list_id": "PL-456"
  },
  "project": {
    "id": "uuid",
    "name": "Planta Industrial XYZ",
    "description": "Limpieza mensual"
  },
  "requester": {
    "id": "uuid",
    "full_name": "José García",
    "email": "jose@solucionesalorden.com"
  },
  "approver": {
    "id": "uuid",
    "full_name": "María López",
    "role_v2": "supervisor",
    "email": "maria@solucionesalorden.com"
  },
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "bind_product_id": "PROD-789",
      "product_name": "Cloro Industrial 5L",
      "product_sku": "CLO-5L-001",
      "quantity": 3,
      "unit_price": 120.00,
      "subtotal": 360.00,
      "unit": "pieza",
      "category": "Limpieza"
    }
  ]
}
```

---

## 🔗 CÓMO N8N CONSUMIRÁ ESTA INFORMACIÓN

### Opción 1: Webhook de Supabase (Realtime)

Supabase puede enviar webhooks cuando cambia una requisición. n8n recibirá el evento y luego llamará a la función:

```http
POST https://[proyecto].supabase.co/rest/v1/rpc/get_requisition_for_bind
Headers:
  apikey: [SUPABASE_ANON_KEY]
  Authorization: Bearer [SUPABASE_ANON_KEY]
  Content-Type: application/json
Body:
{
  "p_requisition_id": "{{$json.record.id}}"
}
```

### Opción 2: Polling (consulta periódica)

n8n puede consultar periódicamente las requisiciones pendientes:

```http
GET https://[proyecto].supabase.co/rest/v1/requisitions_pending_sync
Headers:
  apikey: [SUPABASE_ANON_KEY]
  Authorization: Bearer [SUPABASE_ANON_KEY]
```

Luego para cada una, llamar a `get_requisition_for_bind()`.

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos
- [ ] Agregar campos `bind_folio`, `bind_synced_at`, `bind_error_message`, `bind_sync_attempts`, `approved_at` a `requisitions`
- [ ] Crear índices para optimizar consultas de webhooks
- [ ] Actualizar función `approve_requisition()` para establecer `approved_at`
- [ ] Crear función `get_requisition_for_bind()` para obtener información estructurada
- [ ] Crear función `update_bind_sync_status()` para actualizar estado después de sincronizar
- [ ] Crear vista `requisitions_pending_sync` para facilitar consultas
- [ ] Crear funciones helper `get_bind_client_id()`, `get_bind_product_id()`

### Documentación
- [ ] Documentar estructura JSON que retorna `get_requisition_for_bind()`
- [ ] Crear ejemplos de uso para n8n
- [ ] Documentar endpoints y parámetros

---

## 🎯 RESULTADO FINAL

Después de estos cambios:

1. ✅ **Cada rol cumple su propósito:**
   - Usuario: Crea requisición fácilmente
   - Supervisor: Aprueba con 1 click → sistema marca como `pending_sync`
   - Admin: Puede ver estado de sincronización

2. ✅ **n8n puede obtener fácilmente toda la información:**
   - Una sola llamada a `get_requisition_for_bind()` retorna TODO
   - Estructura JSON clara y completa
   - Incluye todos los IDs necesarios para Bind ERP

3. ✅ **Fácil actualizar estado después de procesar:**
   - Función `update_bind_sync_status()` para marcar como sincronizado
   - Guarda folio de Bind, fecha de sincronización, errores

4. ✅ **Optimizado para webhooks:**
   - Índices para consultas rápidas
   - Vista para consultar pendientes fácilmente
   - Estructura preparada para Realtime de Supabase

---

**Documento creado:** 2025-01-31  
**Estado:** Pendiente de implementación de migraciones

