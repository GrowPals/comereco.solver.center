# 📋 MIGRACIÓN SQL: ADAPTACIÓN PARA N8N

**Fecha:** 2025-01-31  
**Objetivo:** Agregar campos y funciones necesarias para facilitar integración con n8n mediante webhooks

---

## 🚀 MIGRACIÓN COMPLETA

```sql
-- ============================================
-- MIGRACIÓN: Adaptación de Supabase para n8n
-- ============================================
-- Fecha: 2025-01-31
-- Propósito: Facilitar obtención de información para integración con Bind ERP mediante n8n

BEGIN;

-- ============================================
-- 1. Agregar campos faltantes a requisitions
-- ============================================

ALTER TABLE public.requisitions
ADD COLUMN IF NOT EXISTS bind_folio TEXT,
ADD COLUMN IF NOT EXISTS bind_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bind_error_message TEXT,
ADD COLUMN IF NOT EXISTS bind_sync_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_requisitions_bind_folio 
ON public.requisitions(bind_folio) 
WHERE bind_folio IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requisitions_pending_sync 
ON public.requisitions(business_status, integration_status) 
WHERE business_status = 'approved' AND integration_status = 'pending_sync';

CREATE INDEX IF NOT EXISTS idx_requisitions_approved_at 
ON public.requisitions(approved_at) 
WHERE approved_at IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.requisitions.bind_folio IS 'Folio retornado por Bind ERP cuando se crea el pedido';
COMMENT ON COLUMN public.requisitions.bind_synced_at IS 'Fecha y hora en que se sincronizó exitosamente con Bind ERP';
COMMENT ON COLUMN public.requisitions.bind_error_message IS 'Mensaje de error si falla la sincronización con Bind';
COMMENT ON COLUMN public.requisitions.bind_sync_attempts IS 'Número de intentos de sincronización con Bind ERP';
COMMENT ON COLUMN public.requisitions.approved_at IS 'Fecha y hora en que se aprobó la requisición';

-- ============================================
-- 2. Actualizar función approve_requisition para establecer approved_at
-- ============================================

CREATE OR REPLACE FUNCTION public.approve_requisition(
    p_requisition_id UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_requisition RECORD;
    v_is_supervisor BOOLEAN;
    v_is_admin BOOLEAN;
    v_result JSONB;
BEGIN
    -- Obtener información de la requisición
    SELECT 
        r.*,
        p.company_id AS project_company_id,
        p.supervisor_id AS project_supervisor_id
    INTO v_requisition
    FROM public.requisitions r
    LEFT JOIN public.projects p ON r.project_id = p.id
    WHERE r.id = p_requisition_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Requisición no encontrada';
    END IF;

    -- Verificar que esté en estado 'submitted'
    IF v_requisition.business_status != 'submitted' THEN
        RAISE EXCEPTION 'La requisición debe estar en estado "submitted" para ser aprobada';
    END IF;

    -- Verificar permisos
    v_is_admin := EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_v2 = 'admin'
        AND company_id = v_requisition.company_id
    );

    v_is_supervisor := EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role_v2 = 'supervisor'
        AND company_id = v_requisition.company_id
        AND (
            v_requisition.project_supervisor_id = auth.uid()
            OR v_requisition.project_id IS NULL
        )
    );

    IF NOT (v_is_admin OR v_is_supervisor) THEN
        RAISE EXCEPTION 'No tienes permisos para aprobar esta requisición';
    END IF;

    -- Aprobar requisición
    UPDATE public.requisitions
    SET 
        business_status = 'approved',
        integration_status = 'pending_sync', -- IMPORTANTE: Marcar como pendiente de sincronizar
        approved_by = auth.uid(),
        approved_at = NOW(), -- NUEVO
        updated_at = NOW()
    WHERE id = p_requisition_id;

    -- Obtener requisición actualizada
    SELECT to_jsonb(r.*) INTO v_result
    FROM public.requisitions r
    WHERE r.id = p_requisition_id;

    -- Registrar en audit_log
    INSERT INTO public.audit_log (company_id, user_id, event_name, payload)
    VALUES (
        v_requisition.company_id,
        auth.uid(),
        'requisition_approved',
        jsonb_build_object(
            'requisition_id', p_requisition_id,
            'internal_folio', v_requisition.internal_folio,
            'comments', p_comments
        )
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 3. Crear función para obtener información completa estructurada
-- ============================================

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
            'email', COALESCE(
                (SELECT email FROM auth.users WHERE id = requester.id),
                NULL
            )
        ),
        
        -- Información del aprobador
        'approver', CASE 
            WHEN approver.id IS NOT NULL THEN jsonb_build_object(
                'id', approver.id,
                'full_name', approver.full_name,
                'role_v2', approver.role_v2,
                'email', COALESCE(
                    (SELECT email FROM auth.users WHERE id = approver.id),
                    NULL
                )
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
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Requisición no encontrada';
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_requisition_for_bind IS 'Obtiene toda la información de una requisición estructurada para integración con Bind ERP. Incluye requisición, empresa, proyecto, solicitante, aprobador e items con productos.';

-- ============================================
-- 4. Crear función para actualizar estado después de sincronizar
-- ============================================

CREATE OR REPLACE FUNCTION public.update_bind_sync_status(
    p_requisition_id UUID,
    p_bind_folio TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_requisition RECORD;
BEGIN
    -- Verificar que la requisición existe
    SELECT * INTO v_requisition
    FROM public.requisitions
    WHERE id = p_requisition_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Requisición no encontrada';
    END IF;

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

COMMENT ON FUNCTION public.update_bind_sync_status IS 'Actualiza el estado de sincronización de una requisición con Bind ERP después de procesarla en n8n.';

-- ============================================
-- 5. Crear vista para facilitar consultas de webhooks
-- ============================================

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

ALTER VIEW public.requisitions_pending_sync SET (security_invoker = true);

COMMENT ON VIEW public.requisitions_pending_sync IS 'Vista que muestra requisiciones aprobadas que están pendientes de sincronizar con Bind ERP. Útil para webhooks de n8n.';

-- ============================================
-- 6. Crear funciones helper para obtener Bind IDs
-- ============================================

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

COMMIT;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que los campos fueron agregados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'requisitions'
  AND column_name IN ('bind_folio', 'bind_synced_at', 'bind_error_message', 'bind_sync_attempts', 'approved_at');

-- Verificar que las funciones fueron creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_requisition_for_bind',
    'update_bind_sync_status',
    'get_bind_client_id',
    'get_bind_product_id'
  );

-- Verificar que la vista fue creada
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'requisitions_pending_sync';
```

---

## 📝 NOTAS IMPORTANTES

1. **Esta migración es segura** - Solo agrega campos nuevos, no modifica datos existentes
2. **Los campos nuevos son opcionales** - No afectan funcionalidad existente
3. **Los índices mejoran performance** - Especialmente para consultas de webhooks
4. **Las funciones son STABLE o SECURITY DEFINER** - Optimizadas para uso en webhooks

---

## 🧪 PRUEBAS DESPUÉS DE LA MIGRACIÓN

```sql
-- 1. Probar función get_requisition_for_bind
SELECT public.get_requisition_for_bind('[id-de-requisicion-aqui]');

-- 2. Ver requisiciones pendientes de sincronizar
SELECT * FROM public.requisitions_pending_sync LIMIT 10;

-- 3. Probar actualización de estado
SELECT public.update_bind_sync_status(
    '[id-de-requisicion-aqui]',
    'PO-2025-1234',
    true,
    NULL
);
```

---

**Documento creado:** 2025-01-31  
**Estado:** Listo para aplicar

