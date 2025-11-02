# 🚀 PLAN DE ACCIÓN TÉCNICO: INTEGRACIÓN CON BIND ERP

**Fecha:** 2025-01-31  
**Proyecto:** ComerECO - Sistema de Requisiciones  
**Objetivo:** Implementar la integración automática con Bind ERP para cumplir con la visión original

---

## 📋 RESUMEN EJECUTIVO

Este documento detalla los cambios técnicos específicos necesarios para implementar la integración completa con Bind ERP, divididos en fases priorizadas.

**Tiempo estimado total:** 6-8 días de desarrollo  
**Prioridad:** 🔴 **CRÍTICO** - Sin esto, el sistema no cumple su propósito principal

---

## 🎯 FASES DE IMPLEMENTACIÓN

### FASE 1: INFRAESTRUCTURA DE INTEGRACIÓN 🔴

#### Objetivo
Crear la estructura base para mapear entidades de Supabase a Bind ERP y almacenar la configuración de integración.

#### Cambios en Base de Datos

**1.1 Crear tabla `bind_mappings`**

```sql
-- Migration: create_bind_mappings_table
CREATE TABLE IF NOT EXISTS public.bind_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    mapping_type TEXT NOT NULL CHECK (mapping_type IN ('client', 'product', 'location', 'warehouse', 'branch')),
    supabase_id UUID, -- ID de la entidad en Supabase (product_id, project_id, etc.)
    bind_id TEXT NOT NULL, -- ID correspondiente en Bind ERP
    bind_data JSONB, -- Datos adicionales de Bind (nombre, código, etc.)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, mapping_type, supabase_id)
);

-- Índices para performance
CREATE INDEX idx_bind_mappings_company_type ON public.bind_mappings(company_id, mapping_type);
CREATE INDEX idx_bind_mappings_supabase_id ON public.bind_mappings(supabase_id);

-- RLS Policies
ALTER TABLE public.bind_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bind mappings of their company"
    ON public.bind_mappings FOR SELECT
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage bind mappings"
    ON public.bind_mappings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND company_id = bind_mappings.company_id
            AND role_v2 = 'admin'
        )
    );
```

**1.2 Agregar campos a tabla `requisitions`**

```sql
-- Migration: add_bind_integration_fields_to_requisitions
ALTER TABLE public.requisitions
ADD COLUMN IF NOT EXISTS bind_folio TEXT,
ADD COLUMN IF NOT EXISTS bind_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bind_error_message TEXT,
ADD COLUMN IF NOT EXISTS bind_sync_attempts INTEGER DEFAULT 0;

-- Índice para búsquedas por folio de Bind
CREATE INDEX IF NOT EXISTS idx_requisitions_bind_folio ON public.requisitions(bind_folio);
```

**1.3 Agregar campos a tabla `products`**

```sql
-- Migration: add_bind_fields_to_products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS bind_id TEXT,
ADD COLUMN IF NOT EXISTS bind_last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bind_sync_enabled BOOLEAN DEFAULT true;

-- Índice único para bind_id por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_company_bind_id 
ON public.products(company_id, bind_id) 
WHERE bind_id IS NOT NULL;
```

**1.4 Crear tabla `bind_sync_logs`**

```sql
-- Migration: create_bind_sync_logs_table
CREATE TABLE IF NOT EXISTS public.bind_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'requisition', 'manual')),
    entity_type TEXT NOT NULL, -- 'product', 'requisition', etc.
    entity_id UUID, -- ID de la entidad sincronizada
    bind_id TEXT, -- ID en Bind ERP
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    request_payload JSONB, -- Datos enviados a Bind
    response_payload JSONB, -- Respuesta de Bind
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bind_sync_logs_company_type ON public.bind_sync_logs(company_id, sync_type);
CREATE INDEX idx_bind_sync_logs_status ON public.bind_sync_logs(status);
CREATE INDEX idx_bind_sync_logs_synced_at ON public.bind_sync_logs(synced_at DESC);

-- RLS Policies
ALTER TABLE public.bind_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs of their company"
    ON public.bind_sync_logs FOR SELECT
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
```

---

#### Funciones de Base de Datos

**1.5 Función `get_bind_client_id(company_id_param)`**

```sql
-- Migration: create_function_get_bind_client_id
CREATE OR REPLACE FUNCTION public.get_bind_client_id(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_client_id TEXT;
BEGIN
    SELECT bind_id INTO bind_client_id
    FROM public.bind_mappings
    WHERE company_id = company_id_param
      AND mapping_type = 'client'
      AND is_active = true
    LIMIT 1;
    
    RETURN bind_client_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

**1.6 Función `get_bind_product_id(product_id_param)`**

```sql
-- Migration: create_function_get_bind_product_id
CREATE OR REPLACE FUNCTION public.get_bind_product_id(product_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_product_id TEXT;
BEGIN
    -- Primero intentar obtener desde bind_mappings
    SELECT bind_id INTO bind_product_id
    FROM public.bind_mappings
    WHERE supabase_id = product_id_param
      AND mapping_type = 'product'
      AND is_active = true
    LIMIT 1;
    
    -- Si no existe, intentar desde products.bind_id directamente
    IF bind_product_id IS NULL THEN
        SELECT bind_id INTO bind_product_id
        FROM public.products
        WHERE id = product_id_param;
    END IF;
    
    RETURN bind_product_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

**1.7 Función `get_bind_branch_id(project_id_param)`**

```sql
-- Migration: create_function_get_bind_branch_id
CREATE OR REPLACE FUNCTION public.get_bind_branch_id(project_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_branch_id TEXT;
    project_company_id UUID;
BEGIN
    -- Obtener company_id del proyecto
    SELECT company_id INTO project_company_id
    FROM public.projects
    WHERE id = project_id_param;
    
    -- Obtener branch_id desde bind_mappings o desde companies.bind_location_id
    SELECT bind_id INTO bind_branch_id
    FROM public.bind_mappings
    WHERE company_id = project_company_id
      AND mapping_type = 'branch'
      AND supabase_id = project_id_param
      AND is_active = true
    LIMIT 1;
    
    -- Si no existe mapping específico, usar bind_location_id de la empresa
    IF bind_branch_id IS NULL THEN
        SELECT bind_location_id INTO bind_branch_id
        FROM public.companies
        WHERE id = project_company_id;
    END IF;
    
    RETURN bind_branch_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

**1.8 Función `log_bind_sync()`**

```sql
-- Migration: create_function_log_bind_sync
CREATE OR REPLACE FUNCTION public.log_bind_sync(
    p_company_id UUID,
    p_sync_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_bind_id TEXT,
    p_status TEXT,
    p_request_payload JSONB DEFAULT NULL,
    p_response_payload JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.bind_sync_logs (
        company_id,
        sync_type,
        entity_type,
        entity_id,
        bind_id,
        status,
        request_payload,
        response_payload,
        error_message
    ) VALUES (
        p_company_id,
        p_sync_type,
        p_entity_type,
        p_entity_id,
        p_bind_id,
        p_status,
        p_request_payload,
        p_response_payload,
        p_error_message
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

#### Actualizar Trigger Existente

**1.9 Actualizar `enqueue_requisition_for_bind()`**

```sql
-- Migration: update_enqueue_requisition_for_bind_trigger
CREATE OR REPLACE FUNCTION public.enqueue_requisition_for_bind(requisition_id_param UUID)
RETURNS void AS $$
DECLARE
    requisition_record RECORD;
BEGIN
    -- Obtener datos de la requisición
    SELECT 
        id,
        company_id,
        business_status,
        integration_status
    INTO requisition_record
    FROM public.requisitions
    WHERE id = requisition_id_param;
    
    -- Solo procesar si está aprobada y no está ya sincronizada
    IF requisition_record.business_status = 'approved' 
       AND requisition_record.integration_status = 'pending_sync' THEN
       
        -- Actualizar integration_status para que n8n lo detecte
        UPDATE public.requisitions
        SET integration_status = 'pending_sync',
            updated_at = NOW()
        WHERE id = requisition_id_param;
        
        -- Log del evento
        PERFORM public.log_bind_sync(
            requisition_record.company_id,
            'requisition',
            'requisition',
            requisition_id_param,
            NULL,
            'pending',
            NULL,
            NULL,
            NULL
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

#### Cambios en Frontend (Opcional para FASE 1)

**1.10 Servicio `bindService.js`**

```javascript
// src/services/bindService.js

import { supabase } from '@/lib/customSupabaseClient';
import { getCachedSession } from '@/lib/supabaseHelpers';
import logger from '@/utils/logger';

/**
 * Obtiene el mapping de Bind para una entidad
 */
export const getBindMapping = async (mappingType, supabaseId) => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida.");
  }

  const { data, error } = await supabase
    .from('bind_mappings')
    .select('*')
    .eq('mapping_type', mappingType)
    .eq('supabase_id', supabaseId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error getting bind mapping:', error);
    throw new Error('Error al obtener mapping de Bind.');
  }

  return data;
};

/**
 * Crea o actualiza un mapping de Bind
 */
export const upsertBindMapping = async (mappingData) => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida.");
  }

  const { data, error } = await supabase
    .from('bind_mappings')
    .upsert(mappingData, {
      onConflict: 'company_id,mapping_type,supabase_id'
    })
    .select()
    .single();

  if (error) {
    logger.error('Error upserting bind mapping:', error);
    throw new Error('Error al guardar mapping de Bind.');
  }

  return data;
};

/**
 * Obtiene logs de sincronización con Bind
 */
export const getBindSyncLogs = async (limit = 50) => {
  const { session, error: sessionError } = await getCachedSession();
  if (sessionError || !session) {
    throw new Error("Sesión no válida.");
  }

  const { data, error } = await supabase
    .from('bind_sync_logs')
    .select('*')
    .order('synced_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error getting bind sync logs:', error);
    throw new Error('Error al obtener logs de sincronización.');
  }

  return data || [];
};
```

---

**Estimación FASE 1:** 1-2 días

---

### FASE 2: WORKFLOW N8N - CREAR PEDIDOS EN BIND 🔴

#### Objetivo
Crear workflow n8n que detecte cuando se aprueba una requisición y automáticamente cree el pedido en Bind ERP.

#### Estructura del Workflow n8n

**2.1 Configurar Webhook de Supabase**

```
Nodo 1: Webhook (Supabase)
- URL: https://[tu-proyecto].supabase.co/rest/v1/requisitions
- Método: POST
- Headers:
  - apikey: [SUPABASE_ANON_KEY]
  - Authorization: Bearer [SUPABASE_ANON_KEY]
  - Prefer: return=representation
- Filters:
  - business_status = 'approved'
  - integration_status = 'pending_sync'
```

**2.2 Obtener Datos Completos de Requisición**

```
Nodo 2: HTTP Request (Supabase)
- Método: GET
- URL: https://[proyecto].supabase.co/rest/v1/requisitions?id=eq.{{$json.id}}
- Headers: (mismos que arriba)
- Query:
  - select: *,requisition_items(*,products(*))
```

**2.3 Obtener Mappings de Bind**

```
Nodo 3: Function (JavaScript)
- Código:
  const requisition = $input.first().json;
  
  // Obtener company_id
  const companyId = requisition.company_id;
  
  // Mapear items a formato Bind
  const bindItems = requisition.requisition_items.map(item => ({
    ProductID: item.product.bind_id || item.product.id,
    Quantity: item.quantity,
    UnitPrice: item.unit_price
  }));
  
  // Obtener mappings (necesitarás hacer requests adicionales)
  // Por ahora, usar valores por defecto o de configuración
  
  return {
    requisitionId: requisition.id,
    companyId: companyId,
    projectId: requisition.project_id,
    items: bindItems,
    comments: requisition.comments || ''
  };
```

**2.4 Obtener Configuración de Bind (ClientID, BranchID, etc.)**

```
Nodo 4: HTTP Request (Supabase)
- Método: POST
- URL: https://[proyecto].supabase.co/rest/v1/rpc/get_bind_client_id
- Body:
  {
    "company_id_param": "{{$json.companyId}}"
  }
```

**2.5 Crear Pedido en Bind ERP**

```
Nodo 5: HTTP Request (Bind API)
- Método: POST
- URL: [URL_API_BIND]/api/purchase-orders
- Headers:
  - Authorization: Bearer [BIND_API_TOKEN]
  - Content-Type: application/json
- Body:
  {
    "ClientID": "{{$json.bindClientId}}",
    "BranchID": "{{$json.bindBranchId}}",
    "WarehouseID": "{{$json.bindWarehouseId}}",
    "Items": {{$json.items}},
    "Comment": "Requisición ComerECO #{{$json.requisitionId}}"
  }
```

**2.6 Actualizar Estado en Supabase**

```
Nodo 6: HTTP Request (Supabase)
- Método: PATCH
- URL: https://[proyecto].supabase.co/rest/v1/requisitions?id=eq.{{$json.requisitionId}}
- Body:
  {
    "integration_status": "synced",
    "bind_folio": "{{$json.bindResponse.folio}}",
    "bind_synced_at": "{{$now}}",
    "bind_sync_attempts": 1
  }
```

**2.7 Log de Sincronización**

```
Nodo 7: HTTP Request (Supabase)
- Método: POST
- URL: https://[proyecto].supabase.co/rest/v1/rpc/log_bind_sync
- Body:
  {
    "p_company_id": "{{$json.companyId}}",
    "p_sync_type": "requisition",
    "p_entity_type": "requisition",
    "p_entity_id": "{{$json.requisitionId}}",
    "p_bind_id": "{{$json.bindResponse.folio}}",
    "p_status": "success",
    "p_request_payload": {{$json.bindRequest}},
    "p_response_payload": "{{$json.bindResponse}}"
  }
```

**2.8 Enviar Notificación al Usuario**

```
Nodo 8: HTTP Request (Supabase)
- Método: POST
- URL: https://[proyecto].supabase.co/rest/v1/notifications
- Body:
  {
    "user_id": "{{$json.requisitionCreatedBy}}",
    "company_id": "{{$json.companyId}}",
    "type": "success",
    "title": "Requisición procesada en Bind",
    "message": "Tu requisición fue creada en Bind ERP. Folio: {{$json.bindFolio}}",
    "link": "/requisitions/{{$json.requisitionId}}"
  }
```

**2.9 Manejo de Errores**

```
Nodo 9: Error Handler
- Si falla Nodo 5 (Crear pedido en Bind):
  - Actualizar requisition: integration_status = 'sync_failed'
  - Guardar error_message
  - Incrementar bind_sync_attempts
  - Log error
  - Enviar notificación a admin
```

---

#### Configuración de Variables de Entorno n8n

```
N8N_BIND_API_URL=https://api.bind-erp.com
N8N_BIND_API_TOKEN=[token]
N8N_SUPABASE_URL=https://[proyecto].supabase.co
N8N_SUPABASE_ANON_KEY=[key]
N8N_SUPABASE_SERVICE_KEY=[service_key]
```

---

**Estimación FASE 2:** 2-3 días

---

### FASE 3: WORKFLOW N8N - SINCRONIZACIÓN DE PRODUCTOS 🔴

#### Objetivo
Crear workflow n8n que sincronice productos desde Bind ERP a Supabase cada noche.

#### Estructura del Workflow n8n

**3.1 Trigger Cron (Cada noche a las 2 AM)**

```
Nodo 1: Cron
- Schedule: 0 2 * * * (2 AM diario)
```

**3.2 Obtener Empresas Activas**

```
Nodo 2: HTTP Request (Supabase)
- Método: GET
- URL: https://[proyecto].supabase.co/rest/v1/companies?active=eq.true
- Select: id, name, bind_location_id, bind_price_list_id
```

**3.3 Para Cada Empresa: Obtener Productos de Bind**

```
Nodo 3: Loop sobre empresas
```

```
Nodo 4: HTTP Request (Bind API)
- Método: GET
- URL: {{$env.N8N_BIND_API_URL}}/api/products
- Query:
  - location_id: {{$json.bind_location_id}}
  - price_list_id: {{$json.bind_price_list_id}}
  - active: true
```

**3.4 Para Cada Producto: Upsert en Supabase**

```
Nodo 5: Function (JavaScript)
- Código:
  const bindProduct = $input.first().json;
  const companyId = $json.companyId;
  
  return {
    company_id: companyId,
    name: bindProduct.name,
    description: bindProduct.description || '',
    price: bindProduct.price,
    bind_id: bindProduct.id,
    category: bindProduct.category || 'Sin categoría',
    sku: bindProduct.sku || bindProduct.id,
    unit: bindProduct.unit || 'unidad',
    stock: bindProduct.stock || 0,
    active: bindProduct.active !== false,
    bind_last_synced_at: new Date().toISOString()
  };
```

```
Nodo 6: HTTP Request (Supabase)
- Método: POST
- URL: https://[proyecto].supabase.co/rest/v1/rpc/upsert_product_from_bind
- Body:
  {
    "p_company_id": "{{$json.company_id}}",
    "p_product_data": {{$json}}
  }
```

**3.5 Crear Función RPC `upsert_product_from_bind`**

```sql
-- Migration: create_function_upsert_product_from_bind
CREATE OR REPLACE FUNCTION public.upsert_product_from_bind(
    p_company_id UUID,
    p_product_data JSONB
)
RETURNS UUID AS $$
DECLARE
    product_id UUID;
    bind_id_val TEXT;
BEGIN
    bind_id_val := p_product_data->>'bind_id';
    
    -- Buscar si existe producto con este bind_id
    SELECT id INTO product_id
    FROM public.products
    WHERE company_id = p_company_id
      AND bind_id = bind_id_val;
    
    IF product_id IS NOT NULL THEN
        -- Actualizar producto existente
        UPDATE public.products
        SET
            name = p_product_data->>'name',
            description = COALESCE(p_product_data->>'description', ''),
            price = (p_product_data->>'price')::NUMERIC,
            category = COALESCE(p_product_data->>'category', 'Sin categoría'),
            sku = COALESCE(p_product_data->>'sku', bind_id_val),
            unit = COALESCE(p_product_data->>'unit', 'unidad'),
            active = COALESCE((p_product_data->>'active')::BOOLEAN, true),
            bind_last_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = product_id;
    ELSE
        -- Crear nuevo producto
        INSERT INTO public.products (
            company_id,
            name,
            description,
            price,
            bind_id,
            category,
            sku,
            unit,
            active,
            bind_last_synced_at
        ) VALUES (
            p_company_id,
            p_product_data->>'name',
            COALESCE(p_product_data->>'description', ''),
            (p_product_data->>'price')::NUMERIC,
            bind_id_val,
            COALESCE(p_product_data->>'category', 'Sin categoría'),
            COALESCE(p_product_data->>'sku', bind_id_val),
            COALESCE(p_product_data->>'unit', 'unidad'),
            COALESCE((p_product_data->>'active')::BOOLEAN, true),
            NOW()
        )
        RETURNING id INTO product_id;
    END IF;
    
    -- Log sincronización
    PERFORM public.log_bind_sync(
        p_company_id,
        'products',
        'product',
        product_id,
        bind_id_val,
        'success',
        p_product_data,
        jsonb_build_object('product_id', product_id),
        NULL
    );
    
    RETURN product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**3.6 Marcar Productos Eliminados en Bind**

```
Nodo 7: HTTP Request (Supabase)
- Método: PATCH
- URL: https://[proyecto].supabase.co/rest/v1/products
- Query:
  - company_id: eq.{{$json.companyId}}
  - bind_id: not.is.null
  - bind_last_synced_at: lt.{{$json.syncDate}}
- Body:
  {
    "active": false
  }
```

**3.7 Notificar Resultados**

```
Nodo 8: HTTP Request (Supabase)
- Método: POST
- URL: https://[proyecto].supabase.co/rest/v1/notifications
- Body:
  {
    "user_id": [admin_user_id],
    "company_id": "{{$json.companyId}}",
    "type": "info",
    "title": "Sincronización de productos completada",
    "message": "Se sincronizaron {{$json.syncedCount}} productos desde Bind ERP"
  }
```

---

**Estimación FASE 3:** 2 días

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Infraestructura
- [ ] Crear tabla `bind_mappings`
- [ ] Agregar campos `bind_folio`, `bind_synced_at` a `requisitions`
- [ ] Agregar campos `bind_id`, `bind_last_synced_at` a `products`
- [ ] Crear tabla `bind_sync_logs`
- [ ] Crear función `get_bind_client_id()`
- [ ] Crear función `get_bind_product_id()`
- [ ] Crear función `get_bind_branch_id()`
- [ ] Crear función `log_bind_sync()`
- [ ] Actualizar trigger `enqueue_requisition_for_bind()`
- [ ] Crear servicio `bindService.js` (opcional)

### FASE 2: Workflow Crear Pedidos
- [ ] Configurar webhook de Supabase en n8n
- [ ] Crear nodo para obtener datos completos de requisición
- [ ] Crear nodo para obtener mappings de Bind
- [ ] Crear nodo para llamar API de Bind ERP
- [ ] Crear nodo para actualizar estado en Supabase
- [ ] Crear nodo para logging
- [ ] Crear nodo para notificaciones
- [ ] Implementar manejo de errores
- [ ] Probar flujo completo

### FASE 3: Workflow Sincronización Productos
- [ ] Configurar trigger cron en n8n
- [ ] Crear nodo para obtener empresas activas
- [ ] Crear nodo para obtener productos de Bind
- [ ] Crear función RPC `upsert_product_from_bind()`
- [ ] Crear nodo para upsert productos en Supabase
- [ ] Crear nodo para marcar productos eliminados
- [ ] Crear nodo para notificaciones
- [ ] Probar sincronización completa

---

## 🧪 PLAN DE PRUEBAS

### Pruebas FASE 1
1. ✅ Crear mapping manualmente
2. ✅ Verificar funciones retornan valores correctos
3. ✅ Verificar RLS funciona correctamente
4. ✅ Verificar trigger se ejecuta cuando se aprueba

### Pruebas FASE 2
1. ✅ Aprobar requisición manualmente
2. ✅ Verificar webhook recibe evento
3. ✅ Verificar pedido se crea en Bind ERP
4. ✅ Verificar estado se actualiza en Supabase
5. ✅ Verificar notificación se envía al usuario
6. ✅ Probar caso de error (Bind API caída)

### Pruebas FASE 3
1. ✅ Ejecutar workflow manualmente
2. ✅ Verificar productos se sincronizan correctamente
3. ✅ Verificar precios se actualizan
4. ✅ Verificar productos eliminados se marcan como inactivos
5. ✅ Verificar logs se guardan correctamente

---

## 📝 NOTAS IMPORTANTES

### Seguridad
- ✅ Usar `SECURITY DEFINER` solo cuando sea necesario
- ✅ Validar todos los inputs
- ✅ Usar RLS en todas las tablas nuevas
- ✅ No exponer tokens de Bind en frontend

### Performance
- ✅ Usar índices en campos frecuentemente consultados
- ✅ Batch queries cuando sea posible
- ✅ Limitar logs a últimos 90 días (implementar cleanup)

### Monitoreo
- ✅ Configurar alertas si sincronización falla > 3 veces
- ✅ Dashboard de estado de integración
- ✅ Métricas: pedidos creados hoy/semana/mes

---

**Documento creado:** 2025-01-31  
**Última actualización:** 2025-01-31  
**Estado:** Pendiente de implementación

