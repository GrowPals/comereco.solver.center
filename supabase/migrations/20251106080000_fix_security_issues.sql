BEGIN;

-- ========================================
-- Fix 1: Remove SECURITY DEFINER from view
-- ========================================
-- Drop and recreate inventory_restock_rules_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.inventory_restock_rules_view;

CREATE OR REPLACE VIEW public.inventory_restock_rules_view 
WITH (security_invoker = true)
AS
SELECT
    r.id AS rule_id,
    r.company_id,
    r.product_id,
    r.project_id,
    r.min_stock,
    r.reorder_quantity,
    r.status,
    r.notes,
    r.preferred_vendor,
    r.preferred_warehouse,
    r.updated_at,
    p.name AS product_name,
    p.sku AS product_sku,
    p.stock AS current_stock,
    p.category AS product_category,
    pr.name AS project_name,
    pr.status AS project_status
FROM public.inventory_restock_rules r
LEFT JOIN public.products p ON p.id = r.product_id
LEFT JOIN public.projects pr ON pr.id = r.project_id
WHERE r.status = 'active';

COMMENT ON VIEW public.inventory_restock_rules_view IS 
'Active restock rules enriched with product and project metadata for integrations (n8n). Uses SECURITY INVOKER for RLS enforcement.';

GRANT SELECT ON public.inventory_restock_rules_view TO authenticated;
GRANT SELECT ON public.inventory_restock_rules_view TO service_role;

-- ========================================
-- Fix 2: Set search_path for functions
-- ========================================

-- Fix normalize_invitation_email
CREATE OR REPLACE FUNCTION public.normalize_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.email = LOWER(TRIM(NEW.email));
    RETURN NEW;
END;
$$;

-- Fix create_full_requisition
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
    v_item jsonb;
    v_total_amount numeric := 0;
    v_folio text;
BEGIN
    -- Get current user and company
    v_user_id := auth.uid();
    v_company_id := public.get_user_company_id();
    
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'User does not belong to any company';
    END IF;

    -- Generate internal folio
    SELECT 
        COALESCE(prefix, 'REQ-') || 
        LPAD((COALESCE(current_value, 0) + 1)::text, 6, '0')
    INTO v_folio
    FROM public.folio_counters
    WHERE company_id = v_company_id 
      AND entity_type = 'requisition'
    FOR UPDATE;

    -- Create folio counter if doesn't exist
    IF v_folio IS NULL THEN
        INSERT INTO public.folio_counters (company_id, entity_type, current_value, prefix)
        VALUES (v_company_id, 'requisition', 1, 'REQ-')
        ON CONFLICT (company_id, entity_type) DO UPDATE
        SET current_value = folio_counters.current_value + 1;
        
        v_folio := 'REQ-000001';
    ELSE
        UPDATE public.folio_counters
        SET current_value = current_value + 1,
            last_incremented_at = NOW()
        WHERE company_id = v_company_id 
          AND entity_type = 'requisition';
    END IF;

    -- Create requisition
    INSERT INTO public.requisitions (
        company_id,
        project_id,
        created_by,
        internal_folio,
        status,
        comments,
        total_amount
    ) VALUES (
        v_company_id,
        p_project_id,
        v_user_id,
        v_folio,
        'draft',
        p_comments,
        0
    )
    RETURNING id INTO v_requisition_id;

    -- Create requisition items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.requisition_items (
            requisition_id,
            product_id,
            quantity,
            unit_price,
            notes,
            subtotal
        ) VALUES (
            v_requisition_id,
            (v_item->>'product_id')::uuid,
            (v_item->>'quantity')::integer,
            (v_item->>'unit_price')::numeric,
            v_item->>'notes',
            (v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric
        );
        
        v_total_amount := v_total_amount + (
            (v_item->>'quantity')::integer * (v_item->>'unit_price')::numeric
        );
    END LOOP;

    -- Update total amount
    UPDATE public.requisitions
    SET total_amount = v_total_amount
    WHERE id = v_requisition_id;

    RETURN v_requisition_id;
END;
$$;

-- Fix update_products_updated_at
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ========================================
-- Fix 3: Update restock_alerts_dashboard with security_invoker
-- ========================================
DROP VIEW IF EXISTS public.restock_alerts_dashboard;

CREATE OR REPLACE VIEW public.restock_alerts_dashboard
WITH (security_invoker = true)
AS
SELECT 
    r.id AS rule_id,
    r.company_id,
    r.product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    p.category AS product_category,
    p.stock AS current_stock,
    r.min_stock,
    r.reorder_quantity,
    (r.min_stock - p.stock) AS stock_deficit,
    CASE 
        WHEN p.stock <= 0 THEN 'CRITICAL'
        WHEN p.stock < (r.min_stock * 0.5) THEN 'HIGH'
        WHEN p.stock < r.min_stock THEN 'MEDIUM'
        ELSE 'OK'
    END AS alert_level,
    r.project_id,
    pr.name AS project_name,
    r.preferred_vendor,
    r.preferred_warehouse,
    r.notes,
    r.updated_at AS last_rule_update,
    (
        SELECT COUNT(*) 
        FROM public.inventory_restock_rule_logs l 
        WHERE l.rule_id = r.id 
          AND l.created_at > NOW() - INTERVAL '30 days'
    ) AS triggers_last_30_days,
    (
        SELECT MAX(created_at) 
        FROM public.inventory_restock_rule_logs l 
        WHERE l.rule_id = r.id
    ) AS last_trigger_date
FROM public.inventory_restock_rules r
INNER JOIN public.products p ON p.id = r.product_id
LEFT JOIN public.projects pr ON pr.id = r.project_id
WHERE r.status = 'active'
  AND p.is_active = true
ORDER BY 
    CASE 
        WHEN p.stock <= 0 THEN 1
        WHEN p.stock < (r.min_stock * 0.5) THEN 2
        WHEN p.stock < r.min_stock THEN 3
        ELSE 4
    END,
    (r.min_stock - p.stock) DESC;

COMMENT ON VIEW public.restock_alerts_dashboard IS 
'Dashboard view showing all active restock rules with alert levels and recent activity. Uses SECURITY INVOKER for RLS enforcement.';

GRANT SELECT ON public.restock_alerts_dashboard TO authenticated;
GRANT SELECT ON public.restock_alerts_dashboard TO service_role;

COMMIT;
