-- ===================================================================
-- MIGRACIÓN: RPCs para Carrito y Requisiciones
-- Fecha: 2025-01-03
-- Propósito: Crear funciones RPC faltantes para el flujo completo de carrito → requisición
-- ===================================================================

-- ===================================================================
-- 1. clear_user_cart
-- Limpia el carrito del usuario autenticado
-- ===================================================================
CREATE OR REPLACE FUNCTION public.clear_user_cart()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Eliminar todos los items del carrito del usuario
  DELETE FROM public.user_cart_items
  WHERE user_id = auth.uid();
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.clear_user_cart() IS 
'Limpia completamente el carrito del usuario autenticado. Usado después de crear una requisición exitosa.';

-- ===================================================================
-- 2. create_full_requisition
-- Crea una requisición completa con sus items desde el carrito
-- ===================================================================
CREATE OR REPLACE FUNCTION public.create_full_requisition(
  p_project_id uuid,
  p_comments text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition_id uuid;
  v_company_id uuid;
  v_user_id uuid;
  v_internal_folio text;
  v_folio_year int;
  v_folio_number int;
  v_total_amount numeric := 0;
  v_item jsonb;
  v_product_price numeric;
  v_product_name text;
  v_product_unit text;
  v_item_subtotal numeric;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Validar que el proyecto existe y obtener company_id
  SELECT p.company_id INTO v_company_id
  FROM public.projects p
  WHERE p.id = p_project_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no tienes acceso a él';
  END IF;

  -- Verificar que el usuario pertenece a la misma empresa que el proyecto
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para crear requisiciones en este proyecto';
  END IF;

  -- Verificar que el usuario es miembro del proyecto
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No eres miembro de este proyecto';
  END IF;

  -- Validar que hay items
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No se puede crear una requisición sin productos';
  END IF;

  -- Generar folio interno único
  v_folio_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Obtener y actualizar el contador de folios (con bloqueo para evitar race conditions)
  INSERT INTO public.folio_counters (company_id, year, last_folio_number)
  VALUES (v_company_id, v_folio_year, 1)
  ON CONFLICT (company_id, year)
  DO UPDATE SET last_folio_number = folio_counters.last_folio_number + 1
  RETURNING last_folio_number INTO v_folio_number;

  -- Formato: REQ-2025-0001
  v_internal_folio := 'REQ-' || v_folio_year || '-' || LPAD(v_folio_number::text, 4, '0');

  -- Calcular total de la requisición
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Obtener precio actual del producto
    SELECT price, name, unit INTO v_product_price, v_product_name, v_product_unit
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
      AND company_id = v_company_id
      AND is_active = true;

    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Producto % no encontrado o no está disponible', v_item->>'product_id';
    END IF;

    -- Validar cantidad
    IF (v_item->>'quantity')::int <= 0 THEN
      RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
    END IF;

    v_item_subtotal := v_product_price * (v_item->>'quantity')::int;
    v_total_amount := v_total_amount + v_item_subtotal;
  END LOOP;

  -- Crear la requisición
  INSERT INTO public.requisitions (
    company_id,
    project_id,
    created_by,
    internal_folio,
    total_amount,
    comments,
    business_status,
    integration_status
  ) VALUES (
    v_company_id,
    p_project_id,
    v_user_id,
    v_internal_folio,
    v_total_amount,
    p_comments,
    'draft',
    'draft'
  ) RETURNING id INTO v_requisition_id;

  -- Insertar los items de la requisición
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Obtener precio y calcular subtotal nuevamente
    SELECT price, name, unit INTO v_product_price, v_product_name, v_product_unit
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
      AND company_id = v_company_id
      AND is_active = true;

    v_item_subtotal := v_product_price * (v_item->>'quantity')::int;

    -- Insertar item de requisición
    INSERT INTO public.requisition_items (
      requisition_id,
      product_id,
      quantity,
      unit_price,
      subtotal
    ) VALUES (
      v_requisition_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::int,
      v_product_price,
      v_item_subtotal
    );
  END LOOP;

  -- Registrar evento en audit_log
  INSERT INTO public.audit_log (company_id, user_id, event_name, payload)
  VALUES (
    v_company_id,
    v_user_id,
    'requisition_created',
    jsonb_build_object(
      'requisition_id', v_requisition_id,
      'internal_folio', v_internal_folio,
      'project_id', p_project_id,
      'total_amount', v_total_amount,
      'items_count', jsonb_array_length(p_items)
    )
  );

  -- Retornar ID de la requisición creada
  RETURN v_requisition_id;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION public.create_full_requisition(uuid, text, jsonb) IS 
'Crea una requisición completa con sus items. Valida permisos, genera folio único, calcula totales y registra en audit_log.';

-- ===================================================================
-- 3. submit_requisition
-- Envía una requisición para aprobación (draft → submitted)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.submit_requisition(
  p_requisition_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_requisition record;
  v_result jsonb;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener requisición
  SELECT * INTO v_requisition
  FROM public.requisitions
  WHERE id = p_requisition_id;

  IF v_requisition.id IS NULL THEN
    RAISE EXCEPTION 'Requisición no encontrada';
  END IF;

  -- Validar que el usuario es el creador
  IF v_requisition.created_by != v_user_id THEN
    RAISE EXCEPTION 'Solo el creador puede enviar la requisición';
  END IF;

  -- Validar que está en estado draft
  IF v_requisition.business_status != 'draft' THEN
    RAISE EXCEPTION 'Solo se pueden enviar requisiciones en estado borrador';
  END IF;

  -- Validar que tiene items
  IF NOT EXISTS (
    SELECT 1 FROM public.requisition_items WHERE requisition_id = p_requisition_id
  ) THEN
    RAISE EXCEPTION 'La requisición debe tener al menos un producto';
  END IF;

  -- Actualizar estado
  UPDATE public.requisitions
  SET 
    business_status = 'submitted',
    updated_at = now()
  WHERE id = p_requisition_id;

  -- Registrar evento
  INSERT INTO public.audit_log (company_id, user_id, event_name, payload)
  VALUES (
    v_requisition.company_id,
    v_user_id,
    'requisition_submitted',
    jsonb_build_object(
      'requisition_id', p_requisition_id,
      'internal_folio', v_requisition.internal_folio
    )
  );

  -- Crear notificación para el supervisor del proyecto
  IF v_requisition.project_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      company_id,
      type,
      title,
      message,
      link
    )
    SELECT
      p.supervisor_id,
      v_requisition.company_id,
      'info',
      'Nueva requisición pendiente',
      'La requisición ' || v_requisition.internal_folio || ' requiere aprobación',
      '/requisitions/' || p_requisition_id
    FROM public.projects p
    WHERE p.id = v_requisition.project_id
      AND p.supervisor_id IS NOT NULL;
  END IF;

  -- Retornar resultado
  SELECT jsonb_build_object(
    'id', id,
    'internal_folio', internal_folio,
    'business_status', business_status,
    'updated_at', updated_at
  ) INTO v_result
  FROM public.requisitions
  WHERE id = p_requisition_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.submit_requisition(uuid) IS 
'Envía una requisición en borrador para aprobación. Valida estado, crea notificación para supervisor.';

-- ===================================================================
-- 4. approve_requisition
-- Aprueba una requisición (submitted → approved)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.approve_requisition(
  p_requisition_id uuid,
  p_comments text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_requisition record;
  v_is_supervisor boolean := false;
  v_is_admin boolean := false;
  v_result jsonb;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener requisición
  SELECT r.*, pr.role_v2
  INTO v_requisition
  FROM public.requisitions r
  JOIN public.profiles pr ON pr.id = v_user_id
  WHERE r.id = p_requisition_id;

  IF v_requisition.id IS NULL THEN
    RAISE EXCEPTION 'Requisición no encontrada';
  END IF;

  -- Verificar si es admin
  v_is_admin := (v_requisition.role_v2 = 'admin');

  -- Verificar si es supervisor del proyecto
  IF v_requisition.project_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = v_requisition.project_id
        AND supervisor_id = v_user_id
    ) INTO v_is_supervisor;
  END IF;

  -- Validar permisos
  IF NOT (v_is_admin OR v_is_supervisor) THEN
    RAISE EXCEPTION 'No tienes permisos para aprobar esta requisición';
  END IF;

  -- Validar que está en estado submitted
  IF v_requisition.business_status != 'submitted' THEN
    RAISE EXCEPTION 'Solo se pueden aprobar requisiciones en estado enviado';
  END IF;

  -- Actualizar estado
  UPDATE public.requisitions
  SET 
    business_status = 'approved',
    approved_by = v_user_id,
    approved_at = now(),
    updated_at = now(),
    comments = CASE 
      WHEN p_comments IS NOT NULL THEN COALESCE(comments, '') || E'\n[Aprobación] ' || p_comments
      ELSE comments
    END
  WHERE id = p_requisition_id;

  -- Registrar evento
  INSERT INTO public.audit_log (company_id, user_id, event_name, payload)
  VALUES (
    v_requisition.company_id,
    v_user_id,
    'requisition_approved',
    jsonb_build_object(
      'requisition_id', p_requisition_id,
      'internal_folio', v_requisition.internal_folio,
      'approved_by', v_user_id
    )
  );

  -- Crear notificación para el creador
  INSERT INTO public.notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    link
  ) VALUES (
    v_requisition.created_by,
    v_requisition.company_id,
    'success',
    'Requisición aprobada',
    'Tu requisición ' || v_requisition.internal_folio || ' ha sido aprobada',
    '/requisitions/' || p_requisition_id
  );

  -- Retornar resultado
  SELECT jsonb_build_object(
    'id', id,
    'internal_folio', internal_folio,
    'business_status', business_status,
    'approved_by', approved_by,
    'approved_at', approved_at,
    'updated_at', updated_at
  ) INTO v_result
  FROM public.requisitions
  WHERE id = p_requisition_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.approve_requisition(uuid, text) IS 
'Aprueba una requisición. Solo supervisores del proyecto o admins pueden aprobar.';

-- ===================================================================
-- 5. reject_requisition
-- Rechaza una requisición (submitted → rejected)
-- ===================================================================
CREATE OR REPLACE FUNCTION public.reject_requisition(
  p_requisition_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_requisition record;
  v_is_supervisor boolean := false;
  v_is_admin boolean := false;
  v_result jsonb;
BEGIN
  -- Obtener ID del usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Validar razón del rechazo
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'La razón del rechazo es requerida';
  END IF;

  -- Obtener requisición
  SELECT r.*, pr.role_v2
  INTO v_requisition
  FROM public.requisitions r
  JOIN public.profiles pr ON pr.id = v_user_id
  WHERE r.id = p_requisition_id;

  IF v_requisition.id IS NULL THEN
    RAISE EXCEPTION 'Requisición no encontrada';
  END IF;

  -- Verificar si es admin
  v_is_admin := (v_requisition.role_v2 = 'admin');

  -- Verificar si es supervisor del proyecto
  IF v_requisition.project_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = v_requisition.project_id
        AND supervisor_id = v_user_id
    ) INTO v_is_supervisor;
  END IF;

  -- Validar permisos
  IF NOT (v_is_admin OR v_is_supervisor) THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar esta requisición';
  END IF;

  -- Validar que está en estado submitted
  IF v_requisition.business_status != 'submitted' THEN
    RAISE EXCEPTION 'Solo se pueden rechazar requisiciones en estado enviado';
  END IF;

  -- Actualizar estado
  UPDATE public.requisitions
  SET 
    business_status = 'rejected',
    approved_by = v_user_id,
    rejected_at = now(),
    rejection_reason = p_reason,
    updated_at = now()
  WHERE id = p_requisition_id;

  -- Registrar evento
  INSERT INTO public.audit_log (company_id, user_id, event_name, payload)
  VALUES (
    v_requisition.company_id,
    v_user_id,
    'requisition_rejected',
    jsonb_build_object(
      'requisition_id', p_requisition_id,
      'internal_folio', v_requisition.internal_folio,
      'rejected_by', v_user_id,
      'reason', p_reason
    )
  );

  -- Crear notificación para el creador
  INSERT INTO public.notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    link
  ) VALUES (
    v_requisition.created_by,
    v_requisition.company_id,
    'warning',
    'Requisición rechazada',
    'Tu requisición ' || v_requisition.internal_folio || ' fue rechazada. Razón: ' || p_reason,
    '/requisitions/' || p_requisition_id
  );

  -- Retornar resultado
  SELECT jsonb_build_object(
    'id', id,
    'internal_folio', internal_folio,
    'business_status', business_status,
    'approved_by', approved_by,
    'rejected_at', rejected_at,
    'rejection_reason', rejection_reason,
    'updated_at', updated_at
  ) INTO v_result
  FROM public.requisitions
  WHERE id = p_requisition_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.reject_requisition(uuid, text) IS 
'Rechaza una requisición. Solo supervisores del proyecto o admins pueden rechazar. Requiere razón.';

-- ===================================================================
-- GRANT EXECUTE A USUARIOS AUTENTICADOS
-- ===================================================================
GRANT EXECUTE ON FUNCTION public.clear_user_cart() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_full_requisition(uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_requisition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_requisition(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_requisition(uuid, text) TO authenticated;

-- ===================================================================
-- FIN DE LA MIGRACIÓN
-- ===================================================================

