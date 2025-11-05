


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'Migración aplicada: optimize_rls_policies_performance - Todas las políticas RLS optimizadas para mejor performance usando (select auth.uid()) en lugar de auth.uid() directo.';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'employee',
    'admin_corp',
    'super_admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."app_role_v2" AS ENUM (
    'admin',
    'supervisor',
    'user'
);


ALTER TYPE "public"."app_role_v2" OWNER TO "postgres";


CREATE TYPE "public"."business_status" AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'ordered',
    'cancelled'
);


ALTER TYPE "public"."business_status" OWNER TO "postgres";


CREATE TYPE "public"."integration_status" AS ENUM (
    'draft',
    'pending_sync',
    'syncing',
    'synced',
    'rejected',
    'cancelled',
    'sync_failed'
);


ALTER TYPE "public"."integration_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'success',
    'warning',
    'danger',
    'info'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
        integration_status = 'pending_sync',
        approved_by = auth.uid(),
        approved_at = NOW(),
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
$$;


ALTER FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    product_item JSONB;
    product_id UUID;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    errors JSONB := '[]'::jsonb;
    result JSONB;
BEGIN
    -- Validar que p_products es un array
    IF jsonb_typeof(p_products) != 'array' THEN
        RAISE EXCEPTION 'p_products debe ser un array JSON';
    END IF;
    
    -- Procesar cada producto
    FOR product_item IN SELECT * FROM jsonb_array_elements(p_products)
    LOOP
        BEGIN
            SELECT public.upsert_product_from_bind(p_company_id, product_item) INTO product_id;
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || jsonb_build_object(
                'bind_id', product_item->>'bind_id',
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    -- Retornar resultado
    result := jsonb_build_object(
        'total', jsonb_array_length(p_products),
        'success', success_count,
        'errors', error_count,
        'error_details', errors
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") IS 'Procesa múltiples productos desde Bind en una sola transacción. Útil para sincronización masiva.';



CREATE OR REPLACE FUNCTION "public"."broadcast_to_company"("event_name" "text", "payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'realtime'
    AS $$
DECLARE
    v_company_id UUID := get_my_company_id();
    v_topic TEXT;
BEGIN
    v_topic := 'company:' || v_company_id || ':' || event_name;
    PERFORM realtime.broadcast(v_topic, payload::text);
END;
$$;


ALTER FUNCTION "public"."broadcast_to_company"("event_name" "text", "payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_item_subtotal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;
    IF NEW.unit_price IS NULL OR NEW.unit_price < 0 THEN
        RAISE EXCEPTION 'Unit price must be non-negative';
    END IF;
    NEW.subtotal := (NEW.quantity::numeric * NEW.unit_price)::numeric;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_item_subtotal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_item_subtotal"("quantity" integer, "unit_price" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN quantity * unit_price;
END;
$$;


ALTER FUNCTION "public"."calculate_item_subtotal"("quantity" integer, "unit_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer DEFAULT 90, "p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_deleted_count INTEGER;
    v_result JSONB;
BEGIN
    -- Eliminar logs más antiguos que p_days_to_keep
    DELETE FROM public.bind_sync_logs
    WHERE synced_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
      AND (p_company_id IS NULL OR company_id = p_company_id)
      AND status = 'success'; -- Solo eliminar logs exitosos, mantener los fallidos
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    v_result := jsonb_build_object(
        'deleted_count', v_deleted_count,
        'days_kept', p_days_to_keep,
        'message', 'Logs antiguos eliminados exitosamente'
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer, "p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer, "p_company_id" "uuid") IS 'Limpia logs de sincronización exitosos más antiguos que el número de días especificado. Mantiene logs de errores para auditoría.';



CREATE OR REPLACE FUNCTION "public"."clear_user_cart"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_cart_items 
    WHERE user_id = auth.uid();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count
    );
END;
$$;


ALTER FUNCTION "public"."clear_user_cart"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_full_requisition"("p_project_id" "uuid", "p_comments" "text" DEFAULT ''::"text", "p_items" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT p.company_id INTO v_company_id
  FROM public.projects p
  WHERE p.id = p_project_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Proyecto no encontrado o no tienes acceso a él';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para crear requisiciones en este proyecto';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'No eres miembro de este proyecto';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No se puede crear una requisición sin productos';
  END IF;

  v_folio_year := EXTRACT(YEAR FROM CURRENT_DATE);

  INSERT INTO public.folio_counters (company_id, year, last_folio_number)
  VALUES (v_company_id, v_folio_year, 1)
  ON CONFLICT (company_id, year)
  DO UPDATE SET last_folio_number = folio_counters.last_folio_number + 1
  RETURNING last_folio_number INTO v_folio_number;

  v_internal_folio := 'REQ-' || v_folio_year || '-' || LPAD(v_folio_number::text, 4, '0');

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name, unit INTO v_product_price, v_product_name, v_product_unit
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
      AND company_id = v_company_id
      AND is_active = true;

    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Producto % no encontrado o no está disponible', v_item->>'product_id';
    END IF;

    IF (v_item->>'quantity')::int <= 0 THEN
      RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
    END IF;

    v_item_subtotal := v_product_price * (v_item->>'quantity')::int;
    v_total_amount := v_total_amount + v_item_subtotal;
  END LOOP;

  INSERT INTO public.requisitions (
    company_id,
    project_id,
    created_by,
    internal_folio,
    total_amount,
    comments,
    business_status,
    integration_status,
    items
  ) VALUES (
    v_company_id,
    p_project_id,
    v_user_id,
    v_internal_folio,
    v_total_amount,
    p_comments,
    'draft',
    'draft',
    '[]'::jsonb
  ) RETURNING id INTO v_requisition_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price, name, unit INTO v_product_price, v_product_name, v_product_unit
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
      AND company_id = v_company_id
      AND is_active = true;

    v_item_subtotal := v_product_price * (v_item->>'quantity')::int;

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

  PERFORM public.refresh_requisition_items_snapshot(v_requisition_id);

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

  RETURN v_requisition_id;
END;
$$;


ALTER FUNCTION "public"."create_full_requisition"("p_project_id" "uuid", "p_comments" "text", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_after_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invitation public.user_invitations%ROWTYPE;
BEGIN
  SELECT *
  INTO v_invitation
  FROM public.user_invitations
  WHERE email = lower(NEW.email) AND status = 'pending'
  ORDER BY invited_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No invitation registered for email %', NEW.email;
  END IF;

  INSERT INTO public.profiles (id, company_id, full_name, role_v2, is_active, updated_at)
  VALUES (
    NEW.id,
    v_invitation.company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_invitation.role,
    true,
    now()
  );

  UPDATE public.user_invitations
  SET status = 'completed', completed_at = now()
  WHERE id = v_invitation.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_profile_after_signup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_app_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
$$;


ALTER FUNCTION "public"."current_app_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_company_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."current_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN auth.uid();
END;
$$;


ALTER FUNCTION "public"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_requisition_for_bind"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_payload JSONB;
BEGIN
    IF NEW.integration_status = 'pending_sync' AND OLD.integration_status <> 'pending_sync' THEN
        SELECT jsonb_build_object(
            'requisition_id', NEW.id,
            'company_bind_location_id', c.bind_location_id,
            'company_bind_price_list_id', c.bind_price_list_id,
            'internal_folio', NEW.internal_folio,
            'comments', NEW.comments,
            'items', (SELECT jsonb_agg(jsonb_build_object('product_bind_id', p.bind_id, 'quantity', ri.quantity, 'unit_price', ri.unit_price))
                      FROM requisition_items ri JOIN products p ON ri.product_id = p.id WHERE ri.requisition_id = NEW.id)
        ) INTO v_payload
        FROM companies c WHERE c.id = NEW.company_id;
        
        PERFORM pgmq.send('requisition_outbox_queue', v_payload, 300);
        NEW.integration_status = 'syncing';

        INSERT INTO audit_log (company_id, user_id, event_name, payload)
        VALUES (NEW.company_id, auth.uid(), 'requisition.enqueued_for_sync', jsonb_build_object('requisition_id', NEW.id));
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enqueue_requisition_for_bind"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_requisition_for_bind"("requisition_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.requisitions
    SET integration_status = 'pending_sync'
    WHERE id = requisition_id_param;
END;
$$;


ALTER FUNCTION "public"."enqueue_requisition_for_bind"("requisition_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_requisition_data JSONB;
    v_formatted JSONB;
BEGIN
    -- Obtener datos completos con todos los mapeos
    SELECT public.get_requisition_for_bind(p_requisition_id) INTO v_requisition_data;
    
    -- Formatear según estructura esperada por Bind API
    -- Según la visión conceptual, Bind necesita:
    -- {
    --   "ClientID": "...",      // De Soluciones a la Orden
    --   "BranchID": "...",      // De ComerECO (sucursal que surte)
    --   "WarehouseID": "...",   // De ComerECO (almacén)
    --   "ProviderID": "...",   // Interno de ComerECO
    --   "Items": [...]
    -- }
    SELECT jsonb_build_object(
        'ClientID', v_requisition_data->'bind_mappings'->>'client_id',
        'BranchID', v_requisition_data->'bind_mappings'->>'branch_id',
        'WarehouseID', v_requisition_data->'bind_mappings'->>'warehouse_id',
        'ProviderID', v_requisition_data->'bind_mappings'->>'provider_id',
        'PriceListID', v_requisition_data->'bind_mappings'->>'price_list_id',
        'RequisitionNumber', v_requisition_data->'requisition'->>'internal_folio',
        'TotalAmount', v_requisition_data->'requisition'->>'total_amount',
        'Comments', v_requisition_data->'requisition'->>'comments',
        'Date', v_requisition_data->'requisition'->>'approved_at',
        'Requester', jsonb_build_object(
            'ID', v_requisition_data->'requester'->>'id',
            'Name', v_requisition_data->'requester'->>'full_name',
            'Email', v_requisition_data->'requester'->>'email'
        ),
        'Approver', CASE 
            WHEN v_requisition_data->'approver' IS NOT NULL THEN jsonb_build_object(
                'ID', v_requisition_data->'approver'->>'id',
                'Name', v_requisition_data->'approver'->>'full_name',
                'Email', v_requisition_data->'approver'->>'email',
                'Role', v_requisition_data->'approver'->>'role_v2'
            )
            ELSE NULL
        END,
        'Project', CASE 
            WHEN v_requisition_data->'project' IS NOT NULL THEN jsonb_build_object(
                'ID', v_requisition_data->'project'->>'id',
                'Name', v_requisition_data->'project'->>'name',
                'BindBranchID', v_requisition_data->'project'->>'bind_branch_id',
                'BindWarehouseID', v_requisition_data->'project'->>'bind_warehouse_id'
            )
            ELSE NULL
        END,
        'Items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'ProductID', item->>'bind_product_id',
                    'ProductName', item->>'product_name',
                    'SKU', item->>'product_sku',
                    'Quantity', (item->>'quantity')::INTEGER,
                    'UnitPrice', (item->>'unit_price')::NUMERIC,
                    'Subtotal', (item->>'subtotal')::NUMERIC,
                    'Unit', item->>'unit',
                    'Category', item->>'category'
                )
            )
            FROM jsonb_array_elements(v_requisition_data->'items') item
            WHERE item->>'has_bind_id' = 'true'
        ),
        'Metadata', jsonb_build_object(
            'CreatedAt', v_requisition_data->'requisition'->>'created_at',
            'ApprovedAt', v_requisition_data->'requisition'->>'approved_at',
            'SupabaseRequisitionID', v_requisition_data->'requisition'->>'id',
            'Validation', v_requisition_data->'validation'
        )
    ) INTO v_formatted;
    
    RETURN v_formatted;
END;
$$;


ALTER FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") IS 'Formatea requisición en formato específico de Bind ERP API. Incluye TODOS los IDs necesarios (ClientID, BranchID, WarehouseID, ProviderID) para que n8n pueda crear el pedido SIN intervención manual. CRÍTICO para automatización invisible.';



CREATE OR REPLACE FUNCTION "public"."get_bind_branch_id"("p_project_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    bind_branch_id TEXT;
    project_company_id UUID;
BEGIN
    -- Obtener company_id del proyecto
    SELECT company_id INTO project_company_id
    FROM public.projects
    WHERE id = p_project_id;
    
    IF project_company_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Obtener branch_id desde bind_mappings primero
    SELECT bind_id INTO bind_branch_id
    FROM public.bind_mappings
    WHERE company_id = project_company_id
      AND mapping_type = 'branch'
      AND supabase_id = p_project_id
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
$$;


ALTER FUNCTION "public"."get_bind_branch_id"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bind_client_id"("p_company_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_bind_client_id TEXT;
BEGIN
    -- Intentar obtener desde bind_mappings
    SELECT bind_id INTO v_bind_client_id
    FROM public.bind_mappings
    WHERE company_id = p_company_id
      AND mapping_type = 'client'
      AND is_active = true
    LIMIT 1;
    
    RETURN v_bind_client_id;
END;
$$;


ALTER FUNCTION "public"."get_bind_client_id"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bind_product_id"("p_product_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_bind_product_id TEXT;
BEGIN
    SELECT bind_id INTO v_bind_product_id
    FROM public.products
    WHERE id = p_product_id;
    
    RETURN v_bind_product_id;
END;
$$;


ALTER FUNCTION "public"."get_bind_product_id"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid" DEFAULT NULL::"uuid", "p_days" integer DEFAULT 7) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_syncs', COUNT(*),
        'successful_syncs', COUNT(*) FILTER (WHERE status = 'success'),
        'failed_syncs', COUNT(*) FILTER (WHERE status = 'failed'),
        'pending_syncs', COUNT(*) FILTER (WHERE status = 'pending'),
        'syncs_by_type', (
            SELECT jsonb_object_agg(sync_type, count)
            FROM (
                SELECT sync_type, COUNT(*) as count
                FROM public.bind_sync_logs
                WHERE (p_company_id IS NULL OR company_id = p_company_id)
                  AND synced_at >= NOW() - (p_days || ' days')::INTERVAL
                GROUP BY sync_type
            ) sub
        ),
        'last_successful_sync', MAX(synced_at) FILTER (WHERE status = 'success'),
        'last_failed_sync', MAX(synced_at) FILTER (WHERE status = 'failed')
    )
    INTO v_result
    FROM public.bind_sync_logs
    WHERE (p_company_id IS NULL OR company_id = p_company_id)
      AND synced_at >= NOW() - (p_days || ' days')::INTERVAL;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid", "p_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid", "p_days" integer) IS 'Obtiene estadísticas de sincronización con Bind ERP en los últimos N días.';



CREATE OR REPLACE FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_warehouse_id TEXT;
    v_company_id UUID;
BEGIN
    -- Obtener company_id del proyecto
    SELECT company_id INTO v_company_id
    FROM public.projects
    WHERE id = p_project_id;
    
    IF v_company_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Obtener warehouse_id desde bind_mappings
    SELECT bind_id INTO v_warehouse_id
    FROM public.bind_mappings
    WHERE company_id = v_company_id
      AND mapping_type = 'warehouse'
      AND supabase_id = p_project_id
      AND is_active = true
    LIMIT 1;
    
    RETURN v_warehouse_id;
END;
$$;


ALTER FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") IS 'Obtiene el WarehouseID de Bind ERP para un proyecto específico. Usado para mapear proyectos a almacenes de ComerECO.';



CREATE OR REPLACE FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'company', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'bind_location_id', c.bind_location_id,
            'bind_price_list_id', c.bind_price_list_id
        ),
        'bind_client_id', public.get_bind_client_id(p_company_id),
        'mappings', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', mapping_type,
                    'supabase_id', supabase_id,
                    'bind_id', bind_id,
                    'bind_data', bind_data
                )
            )
            FROM public.bind_mappings
            WHERE company_id = p_company_id
              AND is_active = true
        )
    )
    INTO v_result
    FROM public.companies c
    WHERE c.id = p_company_id;
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Empresa no encontrada';
    END IF;
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") IS 'Obtiene toda la información de Bind configurada para una empresa, incluyendo mappings.';



CREATE OR REPLACE FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'company_id', p_company_id,
        'requisitions', jsonb_build_object(
            'total', COUNT(*) FILTER (WHERE business_status = 'approved'),
            'pending_sync', COUNT(*) FILTER (WHERE integration_status = 'pending_sync'),
            'synced', COUNT(*) FILTER (WHERE integration_status = 'synced'),
            'failed', COUNT(*) FILTER (WHERE integration_status = 'sync_failed')
        ),
        'products', jsonb_build_object(
            'total', COUNT(*),
            'with_bind_id', COUNT(*) FILTER (WHERE bind_id IS NOT NULL AND bind_id != ''),
            'pending_sync', (
                SELECT COUNT(*) 
                FROM public.products_pending_sync 
                WHERE company_id = p_company_id
            )
        ),
        'last_sync', (
            SELECT MAX(synced_at)
            FROM public.bind_sync_logs
            WHERE company_id = p_company_id
              AND status = 'success'
        )
    )
    INTO v_result
    FROM public.requisitions
    WHERE company_id = p_company_id
      AND business_status = 'approved';
    
    -- Agregar información de productos
    SELECT jsonb_set(
        v_result,
        '{products}',
        (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'with_bind_id', COUNT(*) FILTER (WHERE bind_id IS NOT NULL AND bind_id != ''),
                'pending_sync', (
                    SELECT COUNT(*) 
                    FROM public.products_pending_sync 
                    WHERE company_id = p_company_id
                )
            )
            FROM public.products
            WHERE company_id = p_company_id
        )
    ) INTO v_result;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") IS 'Obtiene un resumen del estado de sincronización de una empresa con Bind ERP.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_claims"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    claims JSONB;
BEGIN
    SELECT jsonb_strip_nulls(
        jsonb_build_object(
            'company_id', auth.jwt()->>'company_id',
            'role', auth.jwt()->>'app_role'
        )
    ) INTO claims;
    RETURN claims;
END;
$$;


ALTER FUNCTION "public"."get_current_user_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS TABLE("total_requisitions_count" bigint, "active_requisitions_count" bigint, "approved_total" numeric, "total_users_count" bigint, "total_projects_count" bigint, "pending_approvals_count" bigint, "approved_count" bigint, "rejected_count" bigint, "draft_count" bigint, "submitted_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
    v_user_role TEXT;
    v_start_of_month TIMESTAMPTZ;
BEGIN
    -- Obtener información del usuario actual
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Obtener company_id y role del usuario
    SELECT company_id, role_v2 
    INTO v_company_id, v_user_role
    FROM profiles 
    WHERE id = v_user_id;
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Usuario sin compañía asignada';
    END IF;
    
    -- Calcular inicio del mes actual
    v_start_of_month := date_trunc('month', CURRENT_TIMESTAMP);
    
    -- Retornar estadísticas según el rol
    IF v_user_role = 'admin' THEN
        -- Admin ve estadísticas de toda la compañía
        RETURN QUERY
        SELECT
            -- Total de requisiciones
            (SELECT COUNT(*)::BIGINT FROM requisitions WHERE company_id = v_company_id),
            -- Requisiciones activas (submitted, approved)
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status IN ('submitted', 'approved')),
            -- Total aprobado este mes
            (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'approved'
             AND approved_at >= v_start_of_month),
            -- Total de usuarios
            (SELECT COUNT(*)::BIGINT FROM profiles WHERE company_id = v_company_id),
            -- Total de proyectos
            (SELECT COUNT(*)::BIGINT FROM projects WHERE company_id = v_company_id),
            -- Pending approvals (para compatibilidad)
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'submitted'),
            -- Aprobadas este mes
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'approved'
             AND approved_at >= v_start_of_month),
            -- Rechazadas este mes
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'rejected'
             AND rejected_at >= v_start_of_month),
            0::BIGINT, -- draft_count (N/A para admin)
            0::BIGINT; -- submitted_count (N/A para admin)
            
    ELSIF v_user_role = 'supervisor' THEN
        -- Supervisor ve estadísticas de requisiciones que puede aprobar
        RETURN QUERY
        SELECT
            -- Total de requisiciones de la compañía
            (SELECT COUNT(*)::BIGINT FROM requisitions WHERE company_id = v_company_id),
            -- Requisiciones activas
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status IN ('submitted', 'approved')),
            -- Total aprobado por este supervisor este mes
            (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'approved'
             AND approved_by = v_user_id
             AND approved_at >= v_start_of_month),
            0::BIGINT, -- total_users_count (N/A)
            0::BIGINT, -- total_projects_count (N/A)
            -- Pendientes de aprobación
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'submitted'),
            -- Aprobadas por este supervisor este mes
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'approved'
             AND approved_by = v_user_id
             AND approved_at >= v_start_of_month),
            -- Rechazadas por este supervisor este mes
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND business_status = 'rejected'
             AND approved_by = v_user_id
             AND rejected_at >= v_start_of_month),
            0::BIGINT, -- draft_count (N/A)
            0::BIGINT; -- submitted_count (N/A)
            
    ELSE
        -- User (default) ve solo sus propias estadísticas
        RETURN QUERY
        SELECT
            -- Total de requisiciones del usuario
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id AND created_by = v_user_id),
            -- Requisiciones activas del usuario
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND created_by = v_user_id
             AND business_status IN ('submitted', 'approved')),
            -- Total aprobado del usuario este mes
            (SELECT COALESCE(SUM(total_amount), 0)::NUMERIC FROM requisitions 
             WHERE company_id = v_company_id 
             AND created_by = v_user_id
             AND business_status = 'approved'
             AND approved_at >= v_start_of_month),
            0::BIGINT, -- total_users_count (N/A)
            0::BIGINT, -- total_projects_count (N/A)
            0::BIGINT, -- pending_approvals_count (N/A)
            -- Aprobadas del usuario este mes
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND created_by = v_user_id
             AND business_status = 'approved'
             AND approved_at >= v_start_of_month),
            0::BIGINT, -- rejected_count (N/A)
            -- Borradores del usuario
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND created_by = v_user_id
             AND business_status = 'draft'),
            -- Enviadas (pendientes) del usuario
            (SELECT COUNT(*)::BIGINT FROM requisitions 
             WHERE company_id = v_company_id 
             AND created_by = v_user_id
             AND business_status = 'submitted');
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Retorna estadísticas del dashboard según el rol del usuario autenticado (admin, supervisor, user). Filtra automáticamente por company_id.';



CREATE OR REPLACE FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'requisitions', jsonb_build_object(
            'total_approved', COUNT(*) FILTER (WHERE business_status = 'approved'),
            'pending_sync', COUNT(*) FILTER (WHERE integration_status = 'pending_sync' AND business_status = 'approved'),
            'synced', COUNT(*) FILTER (WHERE integration_status = 'synced'),
            'failed', COUNT(*) FILTER (WHERE integration_status = 'sync_failed'),
            'syncing', COUNT(*) FILTER (WHERE integration_status = 'syncing')
        ),
        'sync_stats', public.get_bind_sync_stats(p_company_id, 7),
        'issues', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'requisition_id', id,
                    'internal_folio', internal_folio,
                    'issue_type', issue_type,
                    'issue_description', issue_description
                )
            )
            FROM public.get_requisitions_with_issues(p_company_id)
            LIMIT 10
        ),
        'last_sync', (
            SELECT MAX(synced_at)
            FROM public.bind_sync_logs
            WHERE (p_company_id IS NULL OR company_id = p_company_id)
              AND status = 'success'
        )
    )
    INTO v_result
    FROM public.requisitions
    WHERE p_company_id IS NULL OR company_id = p_company_id;
    
    -- Agregar información de productos por separado
    SELECT jsonb_set(
        v_result,
        '{products}',
        (
            SELECT jsonb_build_object(
                'total', COUNT(*),
                'with_bind_id', COUNT(*) FILTER (WHERE bind_id IS NOT NULL AND bind_id != ''),
                'pending_sync', (
                    SELECT COUNT(*) 
                    FROM public.products_pending_sync 
                    WHERE p_company_id IS NULL OR company_id = p_company_id
                )
            )
            FROM public.products
            WHERE p_company_id IS NULL OR company_id = p_company_id
        )
    ) INTO v_result;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid") IS 'Obtiene un dashboard completo del estado de integración con Bind ERP. Incluye estadísticas, problemas y métricas.';



CREATE OR REPLACE FUNCTION "public"."get_missing_indexes"() RETURNS TABLE("table_name" "text", "column_names" "text", "suggested_index_query" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        s.relname::text, 
        string_agg(a.attname, ', '), 
        'CREATE INDEX CONCURRENTLY ON ' || s.relname || ' (' || string_agg(a.attname, ', ') || ');'
    FROM pg_stat_user_tables s 
    JOIN pg_statio_user_tables sio ON s.relid = sio.relid
    JOIN pg_class c ON c.oid = s.relid 
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE sio.seq_scan > 100 
      AND s.n_live_tup > 10000 
      AND a.attnum > 0 
      AND (a.attname LIKE '%_id' OR a.attname LIKE '%_at')
      AND NOT EXISTS (
          SELECT 1 FROM pg_index i 
          WHERE i.indrelid = s.relid 
            AND a.attnum = ANY(i.indkey)
      )
    GROUP BY s.relname 
    HAVING count(*) > 0;
END;
$$;


ALTER FUNCTION "public"."get_missing_indexes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_claims"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    SELECT coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
$$;


ALTER FUNCTION "public"."get_my_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT get_user_company_id();
$$;


ALTER FUNCTION "public"."get_my_company_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_company_id"() IS 'DEPRECATED: Alias de get_user_company_id(). Usar get_user_company_id() directamente.';



CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "public"."app_role_v2"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN (SELECT role_v2 FROM public.profiles WHERE id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("product_id" "uuid", "product_name" "text", "sku" "text", "category" "text", "company_name" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        c.name
    FROM public.products p
    INNER JOIN public.companies c ON p.company_id = c.id
    WHERE p.is_active = true
      AND (p_company_id IS NULL OR p.company_id = p_company_id)
      AND (p.bind_id IS NULL OR p.bind_id = '');
END;
$$;


ALTER FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid") IS 'Obtiene productos activos que no tienen bind_id configurado. Útil para identificar productos que necesitan configuración.';



CREATE OR REPLACE FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "company_id" "uuid", "bind_id" "text", "name" "text", "sku" "text", "price" numeric, "bind_last_synced_at" timestamp with time zone, "days_since_sync" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.company_id,
        p.bind_id,
        p.name,
        p.sku,
        p.price,
        p.bind_last_synced_at,
        CASE 
            WHEN p.bind_last_synced_at IS NULL THEN 999
            ELSE EXTRACT(DAY FROM (NOW() - p.bind_last_synced_at))::INTEGER
        END AS days_since_sync
    FROM public.products p
    WHERE p.is_active = true
      AND (p_company_id IS NULL OR p.company_id = p_company_id)
      AND (
          p.bind_last_synced_at IS NULL 
          OR p.bind_last_synced_at < NOW() - INTERVAL '24 hours'
      )
    ORDER BY 
        CASE WHEN p.bind_last_synced_at IS NULL THEN 0 ELSE 1 END,
        p.bind_last_synced_at ASC NULLS FIRST
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid", "p_limit" integer) IS 'Obtiene productos que necesitan sincronización con Bind (nunca sincronizados o sincronizados hace más de 24 horas).';



CREATE OR REPLACE FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
    v_requisition_exists BOOLEAN;
BEGIN
    -- Verificar que la requisición existe
    SELECT EXISTS(SELECT 1 FROM public.requisitions WHERE id = p_requisition_id)
    INTO v_requisition_exists;
    
    IF NOT v_requisition_exists THEN
        RAISE EXCEPTION 'Requisición no encontrada';
    END IF;
    
    -- Construir respuesta completa con TODOS los IDs necesarios para Bind ERP
    SELECT jsonb_build_object(
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
        -- Información de empresa (cliente en Bind ERP)
        'company', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'bind_client_id', c.bind_location_id, -- ClientID de Soluciones a la Orden en Bind de ComerECO
            'bind_price_list_id', c.bind_price_list_id
        ),
        -- Información de proyecto con mapeos de Bind
        'project', CASE 
            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'bind_branch_id', public.get_bind_branch_id(p.id), -- BranchID de ComerECO que surte este proyecto
                'bind_warehouse_id', public.get_bind_warehouse_id(p.id) -- WarehouseID de ComerECO para este proyecto
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
        -- Items con información completa de productos
        'items', COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', ri.id,
                        'product_id', ri.product_id,
                        'bind_product_id', pr.bind_id, -- ProductID en Bind ERP
                        'product_name', pr.name,
                        'product_sku', pr.sku,
                        'quantity', ri.quantity,
                        'unit_price', ri.unit_price,
                        'subtotal', ri.subtotal,
                        'unit', pr.unit,
                        'category', pr.category,
                        'has_bind_id', CASE WHEN pr.bind_id IS NOT NULL AND pr.bind_id != '' THEN true ELSE false END
                    )
                    ORDER BY ri.id
                )
                FROM public.requisition_items ri
                LEFT JOIN public.products pr ON ri.product_id = pr.id
                WHERE ri.requisition_id = r.id
            ),
            '[]'::jsonb
        ),
        -- Mapeos completos para Bind ERP ⭐ CRÍTICO
        'bind_mappings', jsonb_build_object(
            'client_id', c.bind_location_id, -- ClientID de Soluciones a la Orden en Bind de ComerECO
            'branch_id', CASE 
                WHEN p.id IS NOT NULL THEN public.get_bind_branch_id(p.id)
                ELSE c.bind_location_id -- Fallback a company si no hay proyecto
            END,
            'warehouse_id', CASE 
                WHEN p.id IS NOT NULL THEN public.get_bind_warehouse_id(p.id)
                ELSE NULL
            END,
            'provider_id', COALESCE(
                (SELECT bind_id FROM public.bind_mappings 
                 WHERE company_id = c.id
                   AND mapping_type = 'client'
                   AND supabase_id = c.id
                   AND is_active = true
                 LIMIT 1),
                c.bind_location_id -- Fallback
            ),
            'price_list_id', c.bind_price_list_id
        ),
        -- Validación automática
        'validation', public.validate_requisition_for_bind(p_requisition_id)
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
$$;


ALTER FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") IS 'Retorna información completa de requisición con TODOS los IDs necesarios para crear pedido en Bind ERP automáticamente. Incluye ClientID, BranchID, WarehouseID, ProviderID, PriceListID y ProductIDs. CRÍTICO para automatización invisible.';



CREATE OR REPLACE FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "internal_folio" "text", "company_id" "uuid", "issue_type" "text", "issue_description" "text", "bind_sync_attempts" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    -- Requisiciones aprobadas sin bind_id en productos
    SELECT 
        r.id,
        r.internal_folio,
        r.company_id,
        'missing_bind_ids'::TEXT AS issue_type,
        'Algunos productos no tienen bind_id configurado'::TEXT AS issue_description,
        r.bind_sync_attempts
    FROM public.requisitions r
    WHERE r.business_status = 'approved'
      AND r.integration_status IN ('pending_sync', 'sync_failed')
      AND (p_company_id IS NULL OR r.company_id = p_company_id)
      AND EXISTS (
          SELECT 1
          FROM public.requisition_items ri
          INNER JOIN public.products p ON ri.product_id = p.id
          WHERE ri.requisition_id = r.id
            AND (p.bind_id IS NULL OR p.bind_id = '')
      )
    
    UNION ALL
    
    -- Requisiciones fallidas múltiples veces
    SELECT 
        r.id,
        r.internal_folio,
        r.company_id,
        'multiple_failures'::TEXT AS issue_type,
        ('Falló ' || r.bind_sync_attempts || ' veces')::TEXT AS issue_description,
        r.bind_sync_attempts
    FROM public.requisitions r
    WHERE r.business_status = 'approved'
      AND r.integration_status = 'sync_failed'
      AND r.bind_sync_attempts >= 3
      AND (p_company_id IS NULL OR r.company_id = p_company_id)
    
    UNION ALL
    
    -- Requisiciones sin empresa con bind_location_id
    SELECT 
        r.id,
        r.internal_folio,
        r.company_id,
        'missing_company_config'::TEXT AS issue_type,
        'La empresa no tiene bind_location_id configurado'::TEXT AS issue_description,
        r.bind_sync_attempts
    FROM public.requisitions r
    WHERE r.business_status = 'approved'
      AND r.integration_status IN ('pending_sync', 'sync_failed')
      AND (p_company_id IS NULL OR r.company_id = p_company_id)
      AND NOT EXISTS (
          SELECT 1
          FROM public.companies c
          WHERE c.id = r.company_id
            AND c.bind_location_id IS NOT NULL
            AND c.bind_location_id != ''
      )
    ORDER BY bind_sync_attempts DESC;
END;
$$;


ALTER FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid") IS 'Identifica requisiciones aprobadas que tienen problemas para sincronizar con Bind ERP. Útil para diagnóstico y corrección.';



CREATE OR REPLACE FUNCTION "public"."get_slow_queries"("show_internal" boolean DEFAULT false) RETURNS TABLE("query" "text", "total_exec_time_ms" numeric, "calls" bigint, "mean_time_ms" numeric, "rows_returned" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        q.query, 
        ROUND(q.total_exec_time::numeric, 2), 
        q.calls, 
        ROUND(q.mean_exec_time::numeric, 2), 
        q.rows 
    FROM pg_stat_statements q
    WHERE q.query NOT LIKE '%pg_stat_statements%' 
      AND (show_internal OR q.query NOT LIKE '%supabase_role%')
    ORDER BY q.total_exec_time DESC 
    LIMIT 10;
END;
$$;


ALTER FUNCTION "public"."get_slow_queries"("show_internal" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unique_product_categories"() RETURNS TABLE("category" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.category
    FROM public.products p
    WHERE p.is_active = true 
      AND p.category IS NOT NULL
    ORDER BY p.category;
END;
$$;


ALTER FUNCTION "public"."get_unique_product_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unique_product_categories"("company_id_param" "uuid") RETURNS TABLE("category" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.category
    FROM public.products p
    WHERE p.company_id = company_id_param
      AND p.category IS NOT NULL
      AND p.is_active = true
    ORDER BY p.category;
END;
$$;


ALTER FUNCTION "public"."get_unique_product_categories"("company_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_company_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_company uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT company_id
  INTO v_company
  FROM public.profiles
  WHERE id = v_uid
  LIMIT 1;

  RETURN v_company;
END;
$$;


ALTER FUNCTION "public"."get_user_company_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_company_id"() IS 'Returns the company_id for the current user with a single auth.uid() evaluation.';



CREATE OR REPLACE FUNCTION "public"."get_user_role_v2"() RETURNS "public"."app_role_v2"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_role app_role_v2;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role_v2
  INTO v_role
  FROM public.profiles
  WHERE id = v_uid
  LIMIT 1;

  RETURN v_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role_v2"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_role_v2"() IS 'Returns the current user role_v2 while evaluating auth.uid() only once.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role_v2)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role_v2')::app_role_v2, 'user'::app_role_v2)
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role app_role_v2 := public.get_user_role_v2();
BEGIN
  RETURN v_role = 'admin'::app_role_v2 OR public.is_platform_admin();
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Checks if the current user has the admin role.';



CREATE OR REPLACE FUNCTION "public"."is_admin_or_supervisor"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role app_role_v2 := public.get_user_role_v2();
BEGIN
  RETURN v_role IN ('admin'::app_role_v2, 'supervisor'::app_role_v2);
END;
$$;


ALTER FUNCTION "public"."is_admin_or_supervisor"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin_or_supervisor"() IS 'Checks if the current user is either admin or supervisor.';



CREATE OR REPLACE FUNCTION "public"."is_platform_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = v_uid
  );
END;
$$;


ALTER FUNCTION "public"."is_platform_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_supervisor"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role app_role_v2 := public.get_user_role_v2();
BEGIN
  RETURN v_role = 'supervisor'::app_role_v2;
END;
$$;


ALTER FUNCTION "public"."is_supervisor"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_supervisor"() IS 'Checks if the current user has the supervisor role.';



CREATE OR REPLACE FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb" DEFAULT NULL::"jsonb", "p_response_payload" "jsonb" DEFAULT NULL::"jsonb", "p_error_message" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb", "p_response_payload" "jsonb", "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb", "p_response_payload" "jsonb", "p_error_message" "text") IS 'Registra un log de sincronización con Bind ERP para auditoría y debugging.';



CREATE OR REPLACE FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone DEFAULT "now"()) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.products
    SET 
        bind_last_synced_at = p_sync_date,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto no encontrado';
    END IF;
END;
$$;


ALTER FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone) IS 'Marca un producto como sincronizado manualmente. Útil para sincronizaciones manuales o correcciones.';



CREATE OR REPLACE FUNCTION "public"."normalize_invitation_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."normalize_invitation_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_requisition_items_snapshot"("p_requisition_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  IF p_requisition_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ri.id,
        'product_id', ri.product_id,
        'quantity', ri.quantity,
        'unit_price', ri.unit_price,
        'subtotal', ri.subtotal,
        'product', jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'sku', p.sku,
          'unit', p.unit,
          'image_url', p.image_url
        )
      ) ORDER BY ri.id
    ), '[]'::jsonb)
  INTO v_snapshot
  FROM public.requisition_items ri
  LEFT JOIN public.products p ON p.id = ri.product_id
  WHERE ri.requisition_id = p_requisition_id;

  UPDATE public.requisitions
  SET items = v_snapshot
  WHERE id = p_requisition_id;
END;
$$;


ALTER FUNCTION "public"."refresh_requisition_items_snapshot"("p_requisition_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_req public.requisitions%ROWTYPE;
BEGIN
  SELECT r.* INTO v_req
  FROM public.requisitions r
  JOIN public.projects p ON r.project_id = p.id
  WHERE r.id = p_requisition_id
    AND r.business_status = 'submitted'
    AND (p.supervisor_id = auth.uid() OR public.is_admin());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar esta requisición';
  END IF;

  UPDATE public.requisitions
  SET business_status = 'rejected',
      rejected_at = now(),
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_requisition_id;

  RETURN jsonb_build_object('success', true, 'requisition_id', p_requisition_id);
END;
$$;


ALTER FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid" DEFAULT NULL::"uuid", "p_max_attempts" integer DEFAULT 3, "p_limit" integer DEFAULT 50) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_requisition RECORD;
    v_result JSONB;
    v_retried INTEGER := 0;
    v_errors INTEGER := 0;
BEGIN
    -- Obtener requisiciones fallidas que no excedan max_attempts
    FOR v_requisition IN 
        SELECT id, company_id, bind_sync_attempts
        FROM public.requisitions
        WHERE business_status = 'approved'
          AND integration_status = 'sync_failed'
          AND bind_sync_attempts < p_max_attempts
          AND (p_company_id IS NULL OR company_id = p_company_id)
        ORDER BY bind_sync_attempts ASC, updated_at ASC
        LIMIT p_limit
    LOOP
        BEGIN
            -- Resetear estado para reintentar
            UPDATE public.requisitions
            SET 
                integration_status = 'pending_sync',
                bind_error_message = NULL,
                updated_at = NOW()
            WHERE id = v_requisition.id;
            
            v_retried := v_retried + 1;
        EXCEPTION WHEN OTHERS THEN
            v_errors := v_errors + 1;
        END;
    END LOOP;
    
    v_result := jsonb_build_object(
        'retried', v_retried,
        'errors', v_errors,
        'max_attempts', p_max_attempts
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid", "p_max_attempts" integer, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid", "p_max_attempts" integer, "p_limit" integer) IS 'Reintenta sincronizaciones fallidas que no excedan el número máximo de intentos. Útil para procesar automáticamente errores temporales.';



CREATE OR REPLACE FUNCTION "public"."same_company_storage"("bucket" "text", "path" "text") RETURNS boolean
    LANGUAGE "sql" STABLE PARALLEL SAFE
    SET "search_path" TO 'public'
    AS $$
    SELECT bucket = 'user-uploads'
       AND SPLIT_PART(path, '/', 1) = 'company'
       AND EXISTS (
         SELECT 1 FROM public.profiles p
         WHERE p.id = auth.uid()
           AND p.company_id = public.storage_company_id(path)
       );
$$;


ALTER FUNCTION "public"."same_company_storage"("bucket" "text", "path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."storage_company_id"("path" "text") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public'
    AS $$
    SELECT NULLIF(SPLIT_PART(path, '/', 2), '')::uuid;
$$;


ALTER FUNCTION "public"."storage_company_id"("path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_req public.requisitions%ROWTYPE;
  v_requires_approval boolean;
  v_final_status public.business_status;
BEGIN
  SELECT * INTO v_req
  FROM public.requisitions r
  WHERE r.id = p_requisition_id
    AND r.created_by = auth.uid()
    AND r.business_status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requisición no encontrada o no puede ser enviada';
  END IF;

  SELECT pm.requires_approval INTO v_requires_approval
  FROM public.project_members pm
  WHERE pm.project_id = v_req.project_id
    AND pm.user_id = auth.uid();

  IF COALESCE(v_requires_approval, true) THEN
    v_final_status := 'submitted';
  ELSE
    v_final_status := 'approved';
  END IF;

  UPDATE public.requisitions
  SET business_status = v_final_status,
      updated_at = now()
  WHERE id = p_requisition_id;

  RETURN jsonb_build_object('success', true, 'requisition_id', p_requisition_id, 'status', v_final_status);
END;
$$;


ALTER FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."topic_company_id"("topic" "text") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public'
    AS $$
    SELECT NULLIF(SPLIT_PART(topic, ':', 2), '')::uuid;
$$;


ALTER FUNCTION "public"."topic_company_id"("topic" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."topic_project_id"("topic" "text") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    SET "search_path" TO 'public'
    AS $$
    SELECT NULLIF(SPLIT_PART(topic, ':', 2), '')::uuid;
$$;


ALTER FUNCTION "public"."topic_project_id"("topic" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_requisition_items"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_requisition_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_requisition_id := OLD.requisition_id;
  ELSE
    v_requisition_id := NEW.requisition_id;
  END IF;

  PERFORM public.refresh_requisition_items_snapshot(v_requisition_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_requisition_items"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bind_mappings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bind_mappings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text" DEFAULT NULL::"text", "p_success" boolean DEFAULT true, "p_error_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_requisition RECORD;
BEGIN
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
$$;


ALTER FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text", "p_success" boolean, "p_error_message" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text", "p_success" boolean, "p_error_message" "text") IS 'Actualiza el estado de sincronización de una requisición con Bind ERP después de procesarla en n8n.';



CREATE OR REPLACE FUNCTION "public"."update_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_requisition_total"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.requisitions
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM public.requisition_items
        WHERE requisition_id = NEW.requisition_id
    )
    WHERE id = NEW.requisition_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_requisition_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    product_id UUID;
    bind_id_val TEXT;
BEGIN
    bind_id_val := p_product_data->>'bind_id';
    
    IF bind_id_val IS NULL OR bind_id_val = '' THEN
        RAISE EXCEPTION 'bind_id es requerido en p_product_data';
    END IF;
    
    -- Buscar si existe producto con este bind_id
    SELECT id INTO product_id
    FROM public.products
    WHERE company_id = p_company_id
      AND bind_id = bind_id_val;
    
    IF product_id IS NOT NULL THEN
        -- Actualizar producto existente
        UPDATE public.products
        SET
            name = COALESCE(p_product_data->>'name', name),
            description = COALESCE(NULLIF(p_product_data->>'description', ''), description),
            price = COALESCE((p_product_data->>'price')::NUMERIC, price),
            stock = COALESCE((p_product_data->>'stock')::INTEGER, stock),
            category = COALESCE(NULLIF(p_product_data->>'category', ''), category),
            sku = COALESCE(NULLIF(p_product_data->>'sku', ''), sku),
            unit = COALESCE(NULLIF(p_product_data->>'unit', ''), unit),
            image_url = COALESCE(NULLIF(p_product_data->>'image_url', ''), image_url),
            is_active = COALESCE((p_product_data->>'is_active')::BOOLEAN, is_active),
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
            stock,
            image_url,
            is_active,
            bind_last_synced_at
        ) VALUES (
            p_company_id,
            p_product_data->>'name',
            NULLIF(p_product_data->>'description', ''),
            COALESCE((p_product_data->>'price')::NUMERIC, 0),
            bind_id_val,
            NULLIF(p_product_data->>'category', ''),
            COALESCE(NULLIF(p_product_data->>'sku', ''), bind_id_val),
            NULLIF(p_product_data->>'unit', ''),
            COALESCE((p_product_data->>'stock')::INTEGER, 0),
            NULLIF(p_product_data->>'image_url', ''),
            COALESCE((p_product_data->>'is_active')::BOOLEAN, true),
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
$$;


ALTER FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") IS 'Crea o actualiza un producto desde datos de Bind ERP. Si el producto existe (por bind_id), lo actualiza. Si no existe, lo crea.';



CREATE OR REPLACE FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_template RECORD;
    v_requester_id UUID := auth.uid();
    v_requisition_id UUID;
BEGIN
    -- Validar autenticación
    IF v_requester_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- 1. Obtener la plantilla y bloquear la fila para la actualización
    SELECT * INTO v_template
    FROM requisition_templates
    WHERE id = p_template_id AND user_id = v_requester_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plantilla no encontrada o no pertenece al usuario.';
    END IF;

    -- Validar que la plantilla tiene items
    IF v_template.items IS NULL OR jsonb_array_length(v_template.items) = 0 THEN
        RAISE EXCEPTION 'La plantilla no tiene productos.';
    END IF;

    -- 2. Crear una nueva requisición usando la sobrecarga correcta
    -- Usa project_id de la plantilla (puede ser NULL)
    v_requisition_id := create_full_requisition(
        v_template.project_id,
        'Requisición creada desde la plantilla: ' || v_template.name,
        v_template.items
    );

    -- 3. Actualizar la plantilla de forma atómica
    UPDATE requisition_templates
    SET
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_template_id;

    -- 4. Registrar en audit log
    INSERT INTO audit_log (company_id, user_id, event_name, payload)
    VALUES (
        get_my_company_id(),
        v_requester_id,
        'template.used',
        jsonb_build_object(
            'template_id', p_template_id,
            'template_name', v_template.name,
            'requisition_id', v_requisition_id
        )
    );

    -- 5. Retornar el ID de la nueva requisición
    RETURN v_requisition_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE INFO 'Error en use_requisition_template: %', SQLERRM;
        RAISE;
END;
$$;


ALTER FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") IS 'Crea una requisición borrador desde una plantilla. Incrementa usage_count y actualiza last_used_at de la plantilla.';



CREATE OR REPLACE FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_requisition RECORD;
    v_items_count INTEGER;
    v_missing_bind_ids INTEGER;
    v_result JSONB;
BEGIN
    -- Obtener requisición
    SELECT * INTO v_requisition
    FROM public.requisitions
    WHERE id = p_requisition_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Requisición no encontrada'
        );
    END IF;
    
    -- Validar estado
    IF v_requisition.business_status != 'approved' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'La requisición debe estar aprobada'
        );
    END IF;
    
    -- Contar items
    SELECT COUNT(*) INTO v_items_count
    FROM public.requisition_items
    WHERE requisition_id = p_requisition_id;
    
    IF v_items_count = 0 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'La requisición no tiene items'
        );
    END IF;
    
    -- Verificar que todos los productos tengan bind_id
    SELECT COUNT(*) INTO v_missing_bind_ids
    FROM public.requisition_items ri
    INNER JOIN public.products p ON ri.product_id = p.id
    WHERE ri.requisition_id = p_requisition_id
      AND (p.bind_id IS NULL OR p.bind_id = '');
    
    -- Verificar que empresa tenga bind_location_id
    IF v_requisition.company_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.companies
            WHERE id = v_requisition.company_id
            AND bind_location_id IS NOT NULL
            AND bind_location_id != ''
        ) THEN
            RETURN jsonb_build_object(
                'valid', false,
                'error', 'La empresa no tiene bind_location_id configurado'
            );
        END IF;
    END IF;
    
    -- Construir resultado
    v_result := jsonb_build_object(
        'valid', true,
        'requisition_id', p_requisition_id,
        'items_count', v_items_count,
        'missing_bind_ids', v_missing_bind_ids,
        'warnings', CASE 
            WHEN v_missing_bind_ids > 0 THEN jsonb_build_array('Algunos productos no tienen bind_id')
            ELSE '[]'::jsonb
        END
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") IS 'Valida que una requisición tenga toda la información necesaria para sincronizar con Bind ERP.';



CREATE OR REPLACE FUNCTION "public"."validate_requisition_status_transition"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_role app_role_v2 := get_my_role();
BEGIN
    IF OLD.business_status IS NOT DISTINCT FROM NEW.business_status THEN 
        RETURN NEW; 
    END IF;
    
    INSERT INTO audit_log (company_id, user_id, event_name, payload)
    VALUES (
        OLD.company_id, 
        auth.uid(), 
        'requisition.business_status.changed', 
        jsonb_build_object(
            'requisition_id', OLD.id, 
            'internal_folio', OLD.internal_folio, 
            'from_status', OLD.business_status, 
            'to_status', NEW.business_status
        )
    );

    IF current_role = 'admin' THEN RETURN NEW; END IF;

    CASE OLD.business_status
        WHEN 'draft' THEN
            IF NEW.business_status NOT IN ('submitted', 'cancelled') THEN 
                RAISE EXCEPTION 'Un borrador solo puede ser enviado o cancelado.'; 
            END IF;
            IF auth.uid() <> OLD.created_by THEN 
                RAISE EXCEPTION 'Solo el solicitante puede modificar un borrador.'; 
            END IF;
        WHEN 'submitted' THEN
            IF NEW.business_status NOT IN ('approved', 'rejected') THEN 
                RAISE EXCEPTION 'Una requisición enviada solo puede ser aprobada o rechazada.'; 
            END IF;
            IF current_role <> 'admin' THEN 
                RAISE EXCEPTION 'Solo un administrador puede aprobar o rechazar.'; 
            END IF;
            IF NEW.business_status = 'approved' THEN 
                NEW.integration_status = 'pending_sync'; 
            END IF;
        WHEN 'approved' THEN
            IF NEW.business_status NOT IN ('ordered', 'cancelled') THEN 
                RAISE EXCEPTION 'Una requisición aprobada solo puede ser marcada como ordenada o cancelada.'; 
            END IF;
            IF current_role <> 'admin' THEN 
                RAISE EXCEPTION 'Solo un administrador puede gestionar una requisición aprobada.'; 
            END IF;
        WHEN 'rejected' THEN
            IF NEW.business_status NOT IN ('draft') THEN 
                RAISE EXCEPTION 'Una requisición rechazada solo puede volver a borrador.'; 
            END IF;
            IF auth.uid() <> OLD.created_by AND current_role <> 'admin' THEN 
                RAISE EXCEPTION 'Acción no permitida en requisición rechazada.'; 
            END IF;
        WHEN 'ordered' THEN 
            RAISE EXCEPTION 'Una requisición ordenada es final y no puede cambiar de estado.'; 
        WHEN 'cancelled' THEN 
            RAISE EXCEPTION 'Una requisición cancelada es final y no puede cambiar de estado.'; 
        ELSE 
            RAISE EXCEPTION 'Estado de origen desconocido: %', OLD.business_status; 
    END CASE;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_requisition_status_transition"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
    v_issues JSONB := '[]'::jsonb;
BEGIN
    -- Verificar requisiciones aprobadas sin items
    SELECT jsonb_agg(
        jsonb_build_object(
            'type', 'requisition_without_items',
            'requisition_id', r.id,
            'internal_folio', r.internal_folio
        )
    )
    INTO v_issues
    FROM public.requisitions r
    WHERE r.business_status = 'approved'
      AND (p_company_id IS NULL OR r.company_id = p_company_id)
      AND NOT EXISTS (
          SELECT 1 FROM public.requisition_items WHERE requisition_id = r.id
      );
    
    v_result := jsonb_build_object(
        'valid', CASE WHEN v_issues IS NULL OR jsonb_array_length(v_issues) = 0 THEN true ELSE false END,
        'issues_count', COALESCE(jsonb_array_length(v_issues), 0),
        'issues', COALESCE(v_issues, '[]'::jsonb)
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid") IS 'Verifica la integridad de datos relacionados con Bind. Identifica problemas de configuración o datos inconsistentes.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "company_id" "uuid",
    "user_id" "uuid",
    "event_name" "text" NOT NULL,
    "payload" "jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."bind_mappings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "mapping_type" "text" NOT NULL,
    "supabase_id" "uuid",
    "bind_id" "text" NOT NULL,
    "bind_data" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bind_mappings_mapping_type_check" CHECK (("mapping_type" = ANY (ARRAY['client'::"text", 'product'::"text", 'location'::"text", 'warehouse'::"text", 'branch'::"text"])))
);


ALTER TABLE "public"."bind_mappings" OWNER TO "postgres";


COMMENT ON TABLE "public"."bind_mappings" IS 'Tabla para mapear entidades de Supabase a IDs de Bind ERP. Permite configurar mappings de clientes, productos, ubicaciones, almacenes y sucursales.';



COMMENT ON COLUMN "public"."bind_mappings"."mapping_type" IS 'Tipo de mapping: client, product, location, warehouse, branch';



COMMENT ON COLUMN "public"."bind_mappings"."supabase_id" IS 'ID de la entidad en Supabase (puede ser product_id, project_id, etc.)';



COMMENT ON COLUMN "public"."bind_mappings"."bind_id" IS 'ID correspondiente en Bind ERP';



COMMENT ON COLUMN "public"."bind_mappings"."bind_data" IS 'Datos adicionales de Bind en formato JSON';



CREATE TABLE IF NOT EXISTS "public"."bind_sync_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "sync_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "bind_id" "text",
    "status" "text" NOT NULL,
    "request_payload" "jsonb",
    "response_payload" "jsonb",
    "error_message" "text",
    "synced_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bind_sync_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'failed'::"text", 'pending'::"text"]))),
    CONSTRAINT "bind_sync_logs_sync_type_check" CHECK (("sync_type" = ANY (ARRAY['products'::"text", 'requisition'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."bind_sync_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."bind_sync_logs" IS 'Logs de todas las sincronizaciones con Bind ERP. Permite auditoría y debugging de integraciones.';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "bind_location_id" "text",
    "bind_price_list_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bind_id" "text" NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "unit" "text",
    "category" "text",
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "bind_last_synced_at" timestamp with time zone,
    "bind_sync_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "price_must_be_non_negative" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_price_non_negative" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_stock_non_negative" CHECK (("stock" >= 0)),
    CONSTRAINT "stock_must_be_non_negative" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Catálogo de productos con 15 productos de ejemplo en 4 categorías';



COMMENT ON COLUMN "public"."products"."bind_sync_enabled" IS 'Indica si el producto debe sincronizarse automáticamente con Bind ERP.';



CREATE OR REPLACE VIEW "public"."company_products_view" WITH ("security_invoker"='true') AS
 SELECT "id",
    "company_id",
    "sku",
    "name",
    "description",
    "price",
    "stock",
    "unit",
    "category",
    "image_url",
    "is_active"
   FROM "public"."products";


ALTER VIEW "public"."company_products_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "public"."app_role" DEFAULT 'employee'::"public"."app_role" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role_v2" "public"."app_role_v2" DEFAULT 'user'::"public"."app_role_v2",
    "is_active" boolean DEFAULT true NOT NULL,
    "phone" "text",
    "can_submit_without_approval" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."role" IS 'DEPRECATED: usar profiles.role_v2 (admin/supervisor/user). Columna legacy (employee/admin_corp/super_admin).';



COMMENT ON COLUMN "public"."profiles"."is_active" IS 'Indica si el usuario está activo. Los usuarios inactivos no pueden iniciar sesión.';



COMMENT ON COLUMN "public"."profiles"."can_submit_without_approval" IS 'Indica si el usuario puede enviar requisiciones sin requerir aprobación del supervisor.';



CREATE TABLE IF NOT EXISTS "public"."requisitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "internal_folio" "text" NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "comments" "text",
    "bind_order_id" "text",
    "bind_status" "text",
    "bind_rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "integration_status" "public"."integration_status" DEFAULT 'draft'::"public"."integration_status" NOT NULL,
    "business_status" "public"."business_status" DEFAULT 'draft'::"public"."business_status" NOT NULL,
    "project_id" "uuid",
    "created_by" "uuid",
    "approved_by" "uuid",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text",
    "bind_folio" "text",
    "bind_synced_at" timestamp with time zone,
    "bind_error_message" "text",
    "bind_sync_attempts" integer DEFAULT 0,
    "approved_at" timestamp with time zone,
    CONSTRAINT "check_bind_sync_attempts_positive" CHECK (("bind_sync_attempts" >= 0))
);


ALTER TABLE "public"."requisitions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."requisitions"."bind_folio" IS 'Folio retornado por Bind ERP cuando se crea el pedido';



COMMENT ON COLUMN "public"."requisitions"."bind_synced_at" IS 'Fecha y hora en que se sincronizó exitosamente con Bind ERP';



COMMENT ON COLUMN "public"."requisitions"."bind_error_message" IS 'Mensaje de error si falla la sincronización con Bind';



COMMENT ON COLUMN "public"."requisitions"."bind_sync_attempts" IS 'Número de intentos de sincronización con Bind ERP';



COMMENT ON COLUMN "public"."requisitions"."approved_at" IS 'Fecha y hora en que se aprobó la requisición';



CREATE OR REPLACE VIEW "public"."dashboard_stats" WITH ("security_invoker"='true') AS
 SELECT "company_id",
    "id" AS "user_id",
    ( SELECT "count"(*) AS "count"
           FROM "public"."requisitions" "r"
          WHERE (("r"."created_by" = "p"."id") AND ("r"."business_status" = 'submitted'::"public"."business_status"))) AS "pending_requisitions",
    ( SELECT "count"(*) AS "count"
           FROM "public"."requisitions" "r"
          WHERE (("r"."created_by" = "p"."id") AND ("r"."business_status" = 'approved'::"public"."business_status"))) AS "approved_requisitions",
    ( SELECT COALESCE("sum"("r"."total_amount"), (0)::numeric) AS "coalesce"
           FROM "public"."requisitions" "r"
          WHERE (("r"."created_by" = "p"."id") AND ("r"."created_at" >= "date_trunc"('month'::"text", "now"())))) AS "month_spending"
   FROM "public"."profiles" "p";


ALTER VIEW "public"."dashboard_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."folio_counters" (
    "company_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "last_folio_number" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."folio_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_admins" (
    "user_id" "uuid" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."platform_admins" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."products_pending_sync" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."company_id",
    "p"."bind_id",
    "p"."name",
    "p"."sku",
    "p"."price",
    "p"."stock",
    "p"."category",
    "p"."bind_last_synced_at",
    "c"."name" AS "company_name",
        CASE
            WHEN ("p"."bind_last_synced_at" IS NULL) THEN 'never'::"text"
            WHEN ("p"."bind_last_synced_at" < ("now"() - '24:00:00'::interval)) THEN 'stale'::"text"
            ELSE 'current'::"text"
        END AS "sync_status"
   FROM ("public"."products" "p"
     JOIN "public"."companies" "c" ON (("p"."company_id" = "c"."id")))
  WHERE (("p"."is_active" = true) AND ("p"."bind_sync_enabled" = true) AND (("p"."bind_last_synced_at" IS NULL) OR ("p"."bind_last_synced_at" < ("now"() - '24:00:00'::interval))));


ALTER VIEW "public"."products_pending_sync" OWNER TO "postgres";


COMMENT ON VIEW "public"."products_pending_sync" IS 'Vista que muestra productos que necesitan sincronización con Bind ERP (nunca sincronizados o sincronizados hace más de 24 horas).';



CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_in_project" "text" DEFAULT 'member'::"text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "requires_approval" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_members"."requires_approval" IS 'Indica si el usuario requiere aprobación del supervisor antes de enviar requisiciones. Si es false, las requisiciones se aprueban automáticamente.';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."project_status" DEFAULT 'active'::"public"."project_status" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "supervisor_id" "uuid"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requisition_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "requisition_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "subtotal" numeric(12,2) NOT NULL,
    CONSTRAINT "quantity_must_be_positive" CHECK (("quantity" > 0)),
    CONSTRAINT "requisition_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."requisition_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requisition_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "items" "jsonb" NOT NULL,
    "is_favorite" boolean DEFAULT false,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid"
);


ALTER TABLE "public"."requisition_templates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."requisitions_pending_sync" WITH ("security_invoker"='true') AS
 SELECT "r"."id",
    "r"."internal_folio",
    "r"."company_id",
    "r"."project_id",
    "r"."created_by",
    "r"."approved_by",
    "r"."total_amount",
    "r"."business_status",
    "r"."integration_status",
    "r"."approved_at",
    "r"."bind_sync_attempts",
    "c"."name" AS "company_name",
    "c"."bind_location_id",
    "c"."bind_price_list_id",
    "p"."name" AS "project_name",
    "requester"."full_name" AS "requester_name",
    "approver"."full_name" AS "approver_name"
   FROM (((("public"."requisitions" "r"
     JOIN "public"."companies" "c" ON (("r"."company_id" = "c"."id")))
     LEFT JOIN "public"."projects" "p" ON (("r"."project_id" = "p"."id")))
     LEFT JOIN "public"."profiles" "requester" ON (("r"."created_by" = "requester"."id")))
     LEFT JOIN "public"."profiles" "approver" ON (("r"."approved_by" = "approver"."id")))
  WHERE (("r"."business_status" = 'approved'::"public"."business_status") AND ("r"."integration_status" = 'pending_sync'::"public"."integration_status"))
  ORDER BY "r"."approved_at";


ALTER VIEW "public"."requisitions_pending_sync" OWNER TO "postgres";


COMMENT ON VIEW "public"."requisitions_pending_sync" IS 'Vista que muestra requisiciones aprobadas que están pendientes de sincronizar con Bind ERP. Útil para webhooks de n8n.';



CREATE TABLE IF NOT EXISTS "public"."user_cart_items" (
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."user_cart_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_cart_items" IS 'Stores the items in a user''s shopping cart.';



COMMENT ON COLUMN "public"."user_cart_items"."quantity" IS 'The quantity of the product in the cart.';



CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_favorites" IS 'Tabla de enlace para los productos favoritos de cada usuario.';



COMMENT ON COLUMN "public"."user_favorites"."user_id" IS 'El ID del usuario que marca el favorito.';



COMMENT ON COLUMN "public"."user_favorites"."product_id" IS 'El ID del producto marcado como favorito.';



CREATE TABLE IF NOT EXISTS "public"."user_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "role" "public"."app_role_v2" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "user_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."user_invitations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bind_mappings"
    ADD CONSTRAINT "bind_mappings_company_id_mapping_type_supabase_id_key" UNIQUE ("company_id", "mapping_type", "supabase_id");



ALTER TABLE ONLY "public"."bind_mappings"
    ADD CONSTRAINT "bind_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bind_sync_logs"
    ADD CONSTRAINT "bind_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_bind_location_id_key" UNIQUE ("bind_location_id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."folio_counters"
    ADD CONSTRAINT "folio_counters_pkey" PRIMARY KEY ("company_id", "year");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_admins"
    ADD CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_company_id_bind_id_key" UNIQUE ("company_id", "bind_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_company_id_sku_key" UNIQUE ("company_id", "sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_pkey" PRIMARY KEY ("project_id", "user_id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requisition_items"
    ADD CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requisition_items"
    ADD CONSTRAINT "requisition_items_requisition_id_product_id_key" UNIQUE ("requisition_id", "product_id");



ALTER TABLE ONLY "public"."requisition_templates"
    ADD CONSTRAINT "requisition_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_cart_items"
    ADD CONSTRAINT "user_cart_items_pkey" PRIMARY KEY ("user_id", "product_id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("user_id", "product_id");



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_log_company_id_event_name" ON "public"."audit_log" USING "btree" ("company_id", "event_name");



CREATE INDEX "idx_audit_log_company_id_timestamp" ON "public"."audit_log" USING "btree" ("company_id", "timestamp" DESC);



CREATE INDEX "idx_audit_log_company_ts" ON "public"."audit_log" USING "btree" ("company_id", "timestamp");



CREATE INDEX "idx_audit_log_user_id" ON "public"."audit_log" USING "btree" ("user_id");



COMMENT ON INDEX "public"."idx_audit_log_user_id" IS 'Performance: Index for FK audit_log.user_id';



CREATE INDEX "idx_bind_mappings_active" ON "public"."bind_mappings" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_bind_mappings_bind_id" ON "public"."bind_mappings" USING "btree" ("bind_id");



CREATE INDEX "idx_bind_mappings_company_type" ON "public"."bind_mappings" USING "btree" ("company_id", "mapping_type");



CREATE INDEX "idx_bind_mappings_supabase_id" ON "public"."bind_mappings" USING "btree" ("supabase_id");



CREATE INDEX "idx_bind_sync_logs_company_type" ON "public"."bind_sync_logs" USING "btree" ("company_id", "sync_type");



CREATE INDEX "idx_bind_sync_logs_entity" ON "public"."bind_sync_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_bind_sync_logs_status" ON "public"."bind_sync_logs" USING "btree" ("status");



CREATE INDEX "idx_bind_sync_logs_synced_at" ON "public"."bind_sync_logs" USING "btree" ("synced_at" DESC);



CREATE INDEX "idx_notifications_company_id" ON "public"."notifications" USING "btree" ("company_id");



COMMENT ON INDEX "public"."idx_notifications_company_id" IS 'Performance: Index for FK notifications.company_id';



CREATE INDEX "idx_notifications_user_is_read_created" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_platform_admins_granted_by" ON "public"."platform_admins" USING "btree" ("granted_by");



CREATE INDEX "idx_products_bind_id" ON "public"."products" USING "btree" ("bind_id");



CREATE UNIQUE INDEX "idx_products_company_bind_id" ON "public"."products" USING "btree" ("company_id", "bind_id") WHERE (("bind_id" IS NOT NULL) AND ("bind_id" <> ''::"text"));



CREATE INDEX "idx_products_company_category_active" ON "public"."products" USING "btree" ("company_id", "category", "is_active") WHERE (("is_active" = true) AND ("category" IS NOT NULL));



COMMENT ON INDEX "public"."idx_products_company_category_active" IS 'Índice compuesto para queries que filtran por compañía, categoría y estado activo simultáneamente.';



CREATE INDEX "idx_products_company_id" ON "public"."products" USING "btree" ("company_id");



CREATE INDEX "idx_products_company_is_active" ON "public"."products" USING "btree" ("company_id", "is_active") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_products_company_is_active" IS 'Índice para optimizar queries que filtran productos activos por compañía. Mejora performance de fetchProducts.';



CREATE INDEX "idx_products_company_sku" ON "public"."products" USING "btree" ("company_id", "sku");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE UNIQUE INDEX "idx_products_sku_unique_per_company" ON "public"."products" USING "btree" ("company_id", "lower"("sku"));



CREATE INDEX "idx_profiles_company_role" ON "public"."profiles" USING "btree" ("company_id", "role_v2");



CREATE INDEX "idx_profiles_id_company" ON "public"."profiles" USING "btree" ("id", "company_id");



CREATE INDEX "idx_profiles_role_v2" ON "public"."profiles" USING "btree" ("role_v2");



CREATE INDEX "idx_project_members_project" ON "public"."project_members" USING "btree" ("project_id");



CREATE INDEX "idx_project_members_user_id" ON "public"."project_members" USING "btree" ("user_id");



CREATE INDEX "idx_projects_company" ON "public"."projects" USING "btree" ("company_id");



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



COMMENT ON INDEX "public"."idx_projects_created_by" IS 'Performance: Index for FK projects.created_by';



CREATE INDEX "idx_projects_supervisor" ON "public"."projects" USING "btree" ("supervisor_id");



CREATE INDEX "idx_requisition_items_product_id" ON "public"."requisition_items" USING "btree" ("product_id");



COMMENT ON INDEX "public"."idx_requisition_items_product_id" IS 'Performance: Index for FK requisition_items.product_id';



CREATE INDEX "idx_requisition_items_requisition_id" ON "public"."requisition_items" USING "btree" ("requisition_id");



CREATE INDEX "idx_requisition_templates_company_id" ON "public"."requisition_templates" USING "btree" ("company_id");



CREATE INDEX "idx_requisitions_approved_at" ON "public"."requisitions" USING "btree" ("approved_at") WHERE ("approved_at" IS NOT NULL);



CREATE INDEX "idx_requisitions_approved_by" ON "public"."requisitions" USING "btree" ("approved_by");



CREATE INDEX "idx_requisitions_bind_folio" ON "public"."requisitions" USING "btree" ("bind_folio") WHERE ("bind_folio" IS NOT NULL);



CREATE INDEX "idx_requisitions_company_id" ON "public"."requisitions" USING "btree" ("company_id");



CREATE INDEX "idx_requisitions_created_by" ON "public"."requisitions" USING "btree" ("created_by");



CREATE INDEX "idx_requisitions_pending_sync" ON "public"."requisitions" USING "btree" ("business_status", "integration_status") WHERE (("business_status" = 'approved'::"public"."business_status") AND ("integration_status" = 'pending_sync'::"public"."integration_status"));



CREATE INDEX "idx_requisitions_project" ON "public"."requisitions" USING "btree" ("project_id");



CREATE INDEX "idx_templates_created_by" ON "public"."requisition_templates" USING "btree" ("user_id");



CREATE INDEX "idx_templates_project" ON "public"."requisition_templates" USING "btree" ("project_id");



CREATE INDEX "idx_user_cart_items_product_id" ON "public"."user_cart_items" USING "btree" ("product_id");



COMMENT ON INDEX "public"."idx_user_cart_items_product_id" IS 'Performance: Index for FK user_cart_items.product_id';



CREATE INDEX "idx_user_cart_items_user_product" ON "public"."user_cart_items" USING "btree" ("user_id", "product_id");



CREATE INDEX "idx_user_favorites_product_id" ON "public"."user_favorites" USING "btree" ("product_id");



COMMENT ON INDEX "public"."idx_user_favorites_product_id" IS 'Performance: Index for FK user_favorites.product_id';



CREATE INDEX "idx_user_favorites_user_product" ON "public"."user_favorites" USING "btree" ("user_id", "product_id");



CREATE INDEX "idx_user_invitations_company" ON "public"."user_invitations" USING "btree" ("company_id");



CREATE INDEX "idx_user_invitations_invited_by" ON "public"."user_invitations" USING "btree" ("invited_by");



CREATE UNIQUE INDEX "user_invitations_pending_unique" ON "public"."user_invitations" USING "btree" ("lower"("email"), "company_id") WHERE ("status" = 'pending'::"text");



CREATE OR REPLACE TRIGGER "normalize_invitation_email" BEFORE INSERT OR UPDATE ON "public"."user_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_invitation_email"();



CREATE OR REPLACE TRIGGER "refresh_requisition_items_snapshot" AFTER INSERT OR DELETE OR UPDATE ON "public"."requisition_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_refresh_requisition_items"();



CREATE OR REPLACE TRIGGER "trigger_update_bind_mappings_updated_at" BEFORE UPDATE ON "public"."bind_mappings" FOR EACH ROW EXECUTE FUNCTION "public"."update_bind_mappings_updated_at"();



CREATE OR REPLACE TRIGGER "update_products_updated_at_trigger" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_products_updated_at"();



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."bind_mappings"
    ADD CONSTRAINT "bind_mappings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bind_sync_logs"
    ADD CONSTRAINT "bind_sync_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."folio_counters"
    ADD CONSTRAINT "folio_counters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."platform_admins"
    ADD CONSTRAINT "platform_admins_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."platform_admins"
    ADD CONSTRAINT "platform_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."requisition_items"
    ADD CONSTRAINT "requisition_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."requisition_items"
    ADD CONSTRAINT "requisition_items_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisition_templates"
    ADD CONSTRAINT "requisition_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisition_templates"
    ADD CONSTRAINT "requisition_templates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisition_templates"
    ADD CONSTRAINT "requisition_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."requisitions"
    ADD CONSTRAINT "requisitions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_cart_items"
    ADD CONSTRAINT "user_cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_cart_items"
    ADD CONSTRAINT "user_cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_invitations"
    ADD CONSTRAINT "user_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create products" ON "public"."products" FOR INSERT WITH CHECK (("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Admins can delete products" ON "public"."products" FOR DELETE USING (("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Admins can update products" ON "public"."products" FOR UPDATE USING (("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert their own notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can only manage their own cart items" ON "public"."user_cart_items" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "Users can only manage their own cart items" ON "public"."user_cart_items" IS 'Política ALL que cubre SELECT, INSERT, UPDATE, DELETE para items del carrito del usuario';



CREATE POLICY "Users can only manage their own favorites" ON "public"."user_favorites" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "Users can only manage their own favorites" ON "public"."user_favorites" IS 'Política ALL que cubre SELECT, INSERT, UPDATE, DELETE para favoritos del usuario';



CREATE POLICY "Users can only see their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can only update their own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "admin_delete_projects" ON "public"."projects" FOR DELETE USING ((("public"."get_user_role_v2"() = 'admin'::"public"."app_role_v2") AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "admin_insert_projects" ON "public"."projects" FOR INSERT WITH CHECK ((("public"."get_user_role_v2"() = 'admin'::"public"."app_role_v2") AND ("company_id" = "public"."get_user_company_id"())));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_select_access" ON "public"."audit_log" FOR SELECT USING (((("company_id" = "public"."get_user_company_id"()) AND ("public"."is_admin"() OR "public"."is_supervisor"())) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."bind_mappings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bind_mappings_delete_admin" ON "public"."bind_mappings" FOR DELETE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "bind_mappings_insert_admin" ON "public"."bind_mappings" FOR INSERT WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "bind_mappings_select_company" ON "public"."bind_mappings" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) OR "public"."is_platform_admin"()));



CREATE POLICY "bind_mappings_update_admin" ON "public"."bind_mappings" FOR UPDATE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"())) WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."bind_sync_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bind_sync_logs_delete" ON "public"."bind_sync_logs" FOR DELETE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "bind_sync_logs_insert" ON "public"."bind_sync_logs" FOR INSERT WITH CHECK ((("company_id" = "public"."get_user_company_id"()) OR "public"."is_platform_admin"()));



CREATE POLICY "bind_sync_logs_select_company" ON "public"."bind_sync_logs" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_delete_platform" ON "public"."companies" FOR DELETE USING ("public"."is_platform_admin"());



CREATE POLICY "companies_insert_platform" ON "public"."companies" FOR INSERT WITH CHECK ("public"."is_platform_admin"());



CREATE POLICY "companies_select_access" ON "public"."companies" FOR SELECT USING ((("id" = "public"."get_user_company_id"()) OR "public"."is_platform_admin"()));



CREATE POLICY "companies_update_manage" ON "public"."companies" FOR UPDATE USING (((("id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"())) WITH CHECK (((("id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."folio_counters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "folio_counters_insert" ON "public"."folio_counters" FOR INSERT WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "folio_counters_select" ON "public"."folio_counters" FOR SELECT USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "folio_counters_update" ON "public"."folio_counters" FOR UPDATE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"())) WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "platform_admins_manage" ON "public"."platform_admins" USING ("public"."is_platform_admin"()) WITH CHECK ("public"."is_platform_admin"());



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_select_access" ON "public"."products" FOR SELECT USING (((("company_id" = "public"."get_user_company_id"()) AND ("public"."is_admin"() OR ("is_active" = true))) OR "public"."is_platform_admin"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_platform_admin"()));



CREATE POLICY "profiles_select_unified" ON "public"."profiles" FOR SELECT USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("company_id" = "public"."get_user_company_id"()))));



CREATE POLICY "profiles_update_unified" ON "public"."profiles" FOR UPDATE USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())))) WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"()))));



ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "project_members_delete_manage" ON "public"."project_members" FOR DELETE USING ((("public"."is_admin"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."company_id" = "public"."get_user_company_id"())))) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"())))))));



CREATE POLICY "project_members_insert_manage" ON "public"."project_members" FOR INSERT WITH CHECK ((("public"."is_admin"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."company_id" = "public"."get_user_company_id"())))) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"())))))));



CREATE POLICY "project_members_select_scope" ON "public"."project_members" FOR SELECT USING ((("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."company_id" = "public"."get_user_company_id"()))) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "project_members_update_manage" ON "public"."project_members" FOR UPDATE USING ((("public"."is_admin"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."company_id" = "public"."get_user_company_id"())))) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))))) WITH CHECK ((("public"."is_admin"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."company_id" = "public"."get_user_company_id"())))) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"())))))));



ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_select_by_company" ON "public"."projects" FOR SELECT USING (("company_id" = "public"."get_user_company_id"()));



CREATE POLICY "projects_update_manage" ON "public"."projects" FOR UPDATE USING ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"())))) WITH CHECK ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"()))));



ALTER TABLE "public"."requisition_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requisition_items_select_simple" ON "public"."requisition_items" FOR SELECT USING (("requisition_id" IN ( SELECT "requisitions"."id"
   FROM "public"."requisitions"
  WHERE ("requisitions"."company_id" = "public"."get_user_company_id"()))));



ALTER TABLE "public"."requisition_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requisition_templates_delete_manage" ON "public"."requisition_templates" FOR DELETE USING ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"()))));



CREATE POLICY "requisition_templates_insert_manage" ON "public"."requisition_templates" FOR INSERT WITH CHECK ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"()))));



CREATE POLICY "requisition_templates_select_scope" ON "public"."requisition_templates" FOR SELECT USING (("public"."is_admin"() OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR ("project_id" IN ( SELECT "pm"."project_id"
   FROM "public"."project_members" "pm"
  WHERE ("pm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "requisition_templates_update_manage" ON "public"."requisition_templates" FOR UPDATE USING ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"())))) WITH CHECK ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"()))));



ALTER TABLE "public"."requisitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requisitions_select_unified" ON "public"."requisitions" FOR SELECT USING ((("company_id" = "public"."get_user_company_id"()) AND ("public"."is_admin"() OR ("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "requisitions_update_manage" ON "public"."requisitions" FOR UPDATE USING ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("business_status" = 'draft'::"public"."business_status")))) WITH CHECK ((("public"."is_admin"() AND ("company_id" = "public"."get_user_company_id"())) OR ("public"."is_supervisor"() AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."supervisor_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("projects"."company_id" = "public"."get_user_company_id"()))))) OR (("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("business_status" = 'draft'::"public"."business_status"))));



ALTER TABLE "public"."user_cart_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_delete_own_draft_items" ON "public"."requisition_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."requisitions" "r"
  WHERE (("r"."id" = "requisition_items"."requisition_id") AND ("r"."created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("r"."business_status" = 'draft'::"public"."business_status")))));



ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_insert_own_audit_logs" ON "public"."audit_log" FOR INSERT WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_insert_own_project_requisitions" ON "public"."requisitions" FOR INSERT WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("company_id" = "public"."get_user_company_id"())));



CREATE POLICY "user_insert_own_requisition_items" ON "public"."requisition_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."requisitions" "r"
  WHERE (("r"."id" = "requisition_items"."requisition_id") AND ("r"."created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("r"."business_status" = 'draft'::"public"."business_status")))));



ALTER TABLE "public"."user_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_invitations_delete_platform" ON "public"."user_invitations" FOR DELETE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "user_invitations_insert_admin" ON "public"."user_invitations" FOR INSERT WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "user_invitations_select_company" ON "public"."user_invitations" FOR SELECT USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "user_invitations_update_admin" ON "public"."user_invitations" FOR UPDATE USING (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"())) WITH CHECK (((("company_id" = "public"."get_user_company_id"()) AND "public"."is_admin"()) OR "public"."is_platform_admin"()));



CREATE POLICY "user_update_own_draft_items" ON "public"."requisition_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."requisitions" "r"
  WHERE (("r"."id" = "requisition_items"."requisition_id") AND ("r"."created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("r"."business_status" = 'draft'::"public"."business_status"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."requisitions" "r"
  WHERE (("r"."id" = "requisition_items"."requisition_id") AND ("r"."created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("r"."business_status" = 'draft'::"public"."business_status")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































































































































REVOKE ALL ON FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_requisition"("p_requisition_id" "uuid", "p_comments" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_upsert_products_from_bind"("p_company_id" "uuid", "p_products" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."broadcast_to_company"("event_name" "text", "payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_to_company"("event_name" "text", "payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_to_company"("event_name" "text", "payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"("quantity" integer, "unit_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"("quantity" integer, "unit_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_item_subtotal"("quantity" integer, "unit_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer, "p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer, "p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_sync_logs"("p_days_to_keep" integer, "p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_user_cart"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_user_cart"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_user_cart"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_full_requisition"("p_project_id" "uuid", "p_comments" "text", "p_items" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_full_requisition"("p_project_id" "uuid", "p_comments" "text", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_full_requisition"("p_project_id" "uuid", "p_comments" "text", "p_items" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_after_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_app_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_app_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"() TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"("requisition_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"("requisition_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_requisition_for_bind"("requisition_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."format_requisition_for_bind_api"("p_requisition_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bind_branch_id"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bind_branch_id"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bind_branch_id"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bind_client_id"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bind_client_id"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bind_client_id"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bind_product_id"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bind_product_id"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bind_product_id"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid", "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid", "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bind_sync_stats"("p_company_id" "uuid", "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bind_warehouse_id"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_bind_info"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_sync_summary"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_integration_dashboard"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_missing_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_missing_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_missing_indexes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_missing_bind_id"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_pending_sync"("p_company_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_requisition_for_bind"("p_requisition_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_requisitions_with_issues"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_slow_queries"("show_internal" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_slow_queries"("show_internal" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_slow_queries"("show_internal" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unique_product_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unique_product_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unique_product_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unique_product_categories"("company_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unique_product_categories"("company_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unique_product_categories"("company_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_supervisor"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_supervisor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_supervisor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_supervisor"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_supervisor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_supervisor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb", "p_response_payload" "jsonb", "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb", "p_response_payload" "jsonb", "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_bind_sync"("p_company_id" "uuid", "p_sync_type" "text", "p_entity_type" "text", "p_entity_id" "uuid", "p_bind_id" "text", "p_status" "text", "p_request_payload" "jsonb", "p_response_payload" "jsonb", "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_product_as_synced"("p_product_id" "uuid", "p_sync_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_invitation_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_invitation_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_invitation_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_requisition_items_snapshot"("p_requisition_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_requisition_items_snapshot"("p_requisition_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_requisition_items_snapshot"("p_requisition_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_requisition"("p_requisition_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid", "p_max_attempts" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid", "p_max_attempts" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."retry_failed_syncs"("p_company_id" "uuid", "p_max_attempts" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."same_company_storage"("bucket" "text", "path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."same_company_storage"("bucket" "text", "path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."same_company_storage"("bucket" "text", "path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."storage_company_id"("path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."storage_company_id"("path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."storage_company_id"("path" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_requisition"("p_requisition_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."topic_company_id"("topic" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."topic_company_id"("topic" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."topic_company_id"("topic" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."topic_project_id"("topic" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."topic_project_id"("topic" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."topic_project_id"("topic" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_requisition_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_requisition_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_requisition_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bind_mappings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bind_mappings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bind_mappings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text", "p_success" boolean, "p_error_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text", "p_success" boolean, "p_error_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bind_sync_status"("p_requisition_id" "uuid", "p_bind_folio" "text", "p_success" boolean, "p_error_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_requisition_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_requisition_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_requisition_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_product_from_bind"("p_company_id" "uuid", "p_product_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_requisition_template"("p_template_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_requisition_for_bind"("p_requisition_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_requisition_status_transition"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_requisition_status_transition"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_requisition_status_transition"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_bind_integrity"("p_company_id" "uuid") TO "service_role";
























GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bind_mappings" TO "anon";
GRANT ALL ON TABLE "public"."bind_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."bind_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."bind_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."bind_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."bind_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."company_products_view" TO "anon";
GRANT ALL ON TABLE "public"."company_products_view" TO "authenticated";
GRANT ALL ON TABLE "public"."company_products_view" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."requisitions" TO "anon";
GRANT ALL ON TABLE "public"."requisitions" TO "authenticated";
GRANT ALL ON TABLE "public"."requisitions" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_stats" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_stats" TO "service_role";



GRANT ALL ON TABLE "public"."folio_counters" TO "anon";
GRANT ALL ON TABLE "public"."folio_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."folio_counters" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."platform_admins" TO "anon";
GRANT ALL ON TABLE "public"."platform_admins" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_admins" TO "service_role";



GRANT ALL ON TABLE "public"."products_pending_sync" TO "anon";
GRANT ALL ON TABLE "public"."products_pending_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."products_pending_sync" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."requisition_items" TO "anon";
GRANT ALL ON TABLE "public"."requisition_items" TO "authenticated";
GRANT ALL ON TABLE "public"."requisition_items" TO "service_role";



GRANT ALL ON TABLE "public"."requisition_templates" TO "anon";
GRANT ALL ON TABLE "public"."requisition_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."requisition_templates" TO "service_role";



GRANT ALL ON TABLE "public"."requisitions_pending_sync" TO "anon";
GRANT ALL ON TABLE "public"."requisitions_pending_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."requisitions_pending_sync" TO "service_role";



GRANT ALL ON TABLE "public"."user_cart_items" TO "anon";
GRANT ALL ON TABLE "public"."user_cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."user_cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorites" TO "anon";
GRANT ALL ON TABLE "public"."user_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorites" TO "service_role";



GRANT ALL ON TABLE "public"."user_invitations" TO "anon";
GRANT ALL ON TABLE "public"."user_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_invitations" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































