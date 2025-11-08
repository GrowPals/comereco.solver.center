BEGIN;

CREATE OR REPLACE FUNCTION public.create_full_requisition(
    p_project_id uuid,
    p_comments text DEFAULT ''::text,
    p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_requisition_id uuid;
    v_company_id uuid;
    v_user_id uuid;
    v_internal_folio text;
    v_folio_year int;
    v_folio_seq int;
    v_total_amount numeric := 0;
    v_item jsonb;
    v_product_price numeric;
    v_item_subtotal numeric;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF p_project_id IS NOT NULL THEN
        SELECT company_id INTO v_company_id
        FROM public.projects
        WHERE id = p_project_id;

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
    ELSE
        v_company_id := public.get_user_company_id();
        IF v_company_id IS NULL THEN
            RAISE EXCEPTION 'User does not belong to any company';
        END IF;
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'No se puede crear una requisición sin productos';
    END IF;

    v_folio_year := EXTRACT(YEAR FROM CURRENT_DATE);

    INSERT INTO public.folio_counters (company_id, year, last_folio_number)
    VALUES (v_company_id, v_folio_year, 1)
    ON CONFLICT (company_id, year)
    DO UPDATE SET last_folio_number = folio_counters.last_folio_number + 1
    RETURNING last_folio_number INTO v_folio_seq;

    v_internal_folio := 'REQ-' || v_folio_year || '-' || LPAD(v_folio_seq::text, 4, '0');

    -- Primera pasada: validar productos y calcular total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO v_product_price
        FROM public.products
        WHERE id = (v_item->>'product_id')::uuid
          AND company_id = v_company_id
          AND is_active = true;

        IF v_product_price IS NULL THEN
            RAISE EXCEPTION 'Producto % no encontrado o no está disponible', v_item->>'product_id';
        END IF;

        IF COALESCE((v_item->>'quantity')::int, 0) <= 0 THEN
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
        COALESCE(p_comments, ''),
        'draft',
        'draft',
        '[]'::jsonb
    ) RETURNING id INTO v_requisition_id;

    -- Segunda pasada: insertar items individuales
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO v_product_price
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

COMMIT;
