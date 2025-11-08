BEGIN;

-- ============================================================
-- 1. Timestamp automation for mutable tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
BEGIN
  IF TG_OP = 'INSERT' AND (to_jsonb(NEW) ? 'created_at') THEN
    IF NEW.created_at IS NULL THEN
      NEW.created_at := v_now;
    END IF;
  END IF;

  IF (to_jsonb(NEW) ? 'updated_at') THEN
    NEW.updated_at := v_now;
  END IF;

  RETURN NEW;
END;
$$;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

ALTER TABLE public.bind_sync_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- Helper to (re)create triggers safely
DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY[
    'bind_mappings',
    'bind_sync_logs',
    'companies',
    'inventory_restock_rules',
    'products',
    'projects',
    'requisition_templates',
    'requisitions',
    'user_cart_items'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_timestamps_on_%I ON public.%I;', v_table, v_table);
    EXECUTE format(
      'CREATE TRIGGER set_timestamps_on_%1$I
         BEFORE INSERT OR UPDATE ON public.%1$I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_timestamps();',
      v_table
    );
  END LOOP;
END
$$;

-- ============================================================
-- 2. Folio sequences (multi-entity support)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folio_sequences (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  year integer NOT NULL,
  prefix text NOT NULL DEFAULT 'SEQ-',
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (company_id, entity_type, year)
);

CREATE INDEX IF NOT EXISTS idx_folio_sequences_company_entity
  ON public.folio_sequences (company_id, entity_type);

-- migrate legacy data (if still present)
INSERT INTO public.folio_sequences (company_id, entity_type, year, prefix, last_value)
SELECT company_id, 'requisition', year, 'REQ-', last_folio_number
FROM public.folio_counters
ON CONFLICT (company_id, entity_type, year) DO UPDATE
SET last_value = EXCLUDED.last_value;

DROP TABLE IF EXISTS public.folio_counters;

ALTER TABLE public.folio_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY folio_sequences_select ON public.folio_sequences
FOR SELECT
USING (is_platform_admin() OR company_id = get_user_company_id());

CREATE POLICY folio_sequences_insert ON public.folio_sequences
FOR INSERT
WITH CHECK ((company_id = get_user_company_id() AND is_admin()) OR is_platform_admin());

CREATE POLICY folio_sequences_update ON public.folio_sequences
FOR UPDATE
USING ((company_id = get_user_company_id() AND is_admin()) OR is_platform_admin())
WITH CHECK ((company_id = get_user_company_id() AND is_admin()) OR is_platform_admin());

CREATE OR REPLACE FUNCTION public.get_next_folio(
  p_company_id uuid,
  p_entity_type text,
  p_prefix text DEFAULT 'SEQ-'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM CURRENT_DATE);
  v_prefix text := COALESCE(NULLIF(TRIM(p_prefix), ''), 'SEQ-');
  v_next integer;
  v_now timestamptz := timezone('utc', now());
BEGIN
  INSERT INTO public.folio_sequences (company_id, entity_type, year, prefix, last_value, created_at, updated_at)
  VALUES (p_company_id, p_entity_type, v_year, v_prefix, 1, v_now, v_now)
  ON CONFLICT (company_id, entity_type, year)
  DO UPDATE SET last_value = public.folio_sequences.last_value + 1,
                prefix = EXCLUDED.prefix,
                updated_at = v_now
  RETURNING last_value INTO v_next;

  RETURN v_prefix || v_year::text || '-' || LPAD(v_next::text, 4, '0');
END;
$$;

-- ============================================================
-- 3. Update requisition factory to use new folio helper
-- ============================================================
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

    v_internal_folio := public.get_next_folio(v_company_id, 'requisition', 'REQ-');

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
