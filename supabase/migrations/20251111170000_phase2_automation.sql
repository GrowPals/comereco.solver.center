BEGIN;

-- ============================================================
-- 1. Requisition template items normalization
-- ============================================================
CREATE TABLE IF NOT EXISTS public.requisition_template_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES public.requisition_templates(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_items_template_product
  ON public.requisition_template_items (template_id, product_id);

DROP TRIGGER IF EXISTS set_timestamps_on_requisition_template_items ON public.requisition_template_items;
CREATE TRIGGER set_timestamps_on_requisition_template_items
  BEFORE INSERT OR UPDATE ON public.requisition_template_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps();

-- Backfill from existing JSON items
INSERT INTO public.requisition_template_items (template_id, product_id, quantity)
SELECT
  t.id,
  (item->>'product_id')::uuid,
  GREATEST((item->>'quantity')::integer, 1)
FROM public.requisition_templates t
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.items, '[]'::jsonb)) AS item
ON CONFLICT (template_id, product_id) DO UPDATE
SET quantity = EXCLUDED.quantity;

CREATE OR REPLACE FUNCTION public.sync_requisition_template_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
BEGIN
  DELETE FROM public.requisition_template_items WHERE template_id = NEW.id;

  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.requisition_template_items (template_id, product_id, quantity)
  SELECT
    NEW.id,
    (value->>'product_id')::uuid,
    GREATEST((value->>'quantity')::integer, 1)
  FROM jsonb_array_elements(NEW.items) value
  WHERE value ? 'product_id' AND value ? 'quantity';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_template_items_from_json ON public.requisition_templates;
CREATE TRIGGER sync_template_items_from_json
  AFTER INSERT OR UPDATE OF items ON public.requisition_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_requisition_template_items();

CREATE VIEW public.requisition_template_items_view AS
SELECT
  rti.template_id,
  rti.product_id,
  rti.quantity,
  p.sku,
  p.name,
  p.unit,
  p.category
FROM public.requisition_template_items rti
LEFT JOIN public.products p ON p.id = rti.product_id;

-- ============================================================
-- 2. Integration queue table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integration_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  target_system text NOT NULL DEFAULT 'bind',
  payload jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, success, error
  priority smallint NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 9),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  locked_at timestamptz,
  locked_by uuid,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_integration_queue_status_schedule
  ON public.integration_queue (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_integration_queue_entity
  ON public.integration_queue (entity_type, entity_id);

DROP TRIGGER IF EXISTS set_timestamps_on_integration_queue ON public.integration_queue;
CREATE TRIGGER set_timestamps_on_integration_queue
  BEFORE INSERT OR UPDATE ON public.integration_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps();

ALTER TABLE public.integration_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_queue_select_company
  ON public.integration_queue
  FOR SELECT
  USING (is_platform_admin() OR company_id = get_user_company_id());

CREATE POLICY integration_queue_mutate_company
  ON public.integration_queue
  FOR ALL
  USING ((company_id = get_user_company_id() AND is_admin()) OR is_platform_admin())
  WITH CHECK ((company_id = get_user_company_id() AND is_admin()) OR is_platform_admin());

-- ============================================================
-- 3. Materialized views for n8n / integrations
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS public.mv_products_for_sync;
CREATE MATERIALIZED VIEW public.mv_products_for_sync AS
WITH last_success AS (
  SELECT entity_id AS product_id, MAX(synced_at) AS last_success_synced_at
  FROM public.bind_sync_logs
  WHERE entity_type = 'product' AND status = 'success'
  GROUP BY entity_id
),
last_event AS (
  SELECT DISTINCT ON (entity_id)
    entity_id AS product_id,
    status AS last_status,
    synced_at AS last_status_at,
    error_message
  FROM public.bind_sync_logs
  WHERE entity_type = 'product'
  ORDER BY entity_id, synced_at DESC
)
SELECT
  p.id AS product_id,
  p.company_id,
  p.bind_id,
  p.sku,
  p.name,
  p.description,
  p.category,
  p.unit,
  p.price,
  p.stock,
  p.is_active,
  p.updated_at,
  ls.last_success_synced_at,
  le.last_status,
  le.error_message,
  (ls.last_success_synced_at IS NULL OR p.updated_at > ls.last_success_synced_at) AS needs_sync
FROM public.products p
LEFT JOIN last_success ls ON ls.product_id = p.id
LEFT JOIN last_event le ON le.product_id = p.id;

CREATE UNIQUE INDEX IF NOT EXISTS mv_products_for_sync_pk
  ON public.mv_products_for_sync (product_id);

DROP MATERIALIZED VIEW IF EXISTS public.mv_requisitions_for_bind;
CREATE MATERIALIZED VIEW public.mv_requisitions_for_bind AS
WITH last_success AS (
  SELECT entity_id AS requisition_id, MAX(synced_at) AS last_success_synced_at
  FROM public.bind_sync_logs
  WHERE entity_type = 'requisition' AND status = 'success'
  GROUP BY entity_id
),
last_event AS (
  SELECT DISTINCT ON (entity_id)
    entity_id AS requisition_id,
    status AS last_status,
    synced_at AS last_status_at,
    error_message
  FROM public.bind_sync_logs
  WHERE entity_type = 'requisition'
  ORDER BY entity_id, synced_at DESC
)
SELECT
  r.id AS requisition_id,
  r.company_id,
  r.project_id,
  r.internal_folio,
  r.business_status,
  r.integration_status,
  r.total_amount,
  r.created_at,
  r.updated_at,
  ls.last_success_synced_at,
  le.last_status,
  le.error_message,
  (ls.last_success_synced_at IS NULL OR r.updated_at > ls.last_success_synced_at OR r.integration_status <> 'synced') AS needs_sync
FROM public.requisitions r
LEFT JOIN last_success ls ON ls.requisition_id = r.id
LEFT JOIN last_event le ON le.requisition_id = r.id;

CREATE UNIQUE INDEX IF NOT EXISTS mv_requisitions_for_bind_pk
  ON public.mv_requisitions_for_bind (requisition_id);

DROP MATERIALIZED VIEW IF EXISTS public.mv_restock_alerts;
CREATE MATERIALIZED VIEW public.mv_restock_alerts AS
SELECT
  irr.id AS rule_id,
  irr.company_id,
  irr.product_id,
  irr.project_id,
  irr.status,
  irr.min_stock,
  irr.reorder_quantity,
  irr.preferred_vendor,
  irr.preferred_warehouse,
  irr.updated_at AS rule_updated_at,
  p.sku,
  p.name,
  p.category,
  p.stock,
  p.unit,
  p.price,
  GREATEST(irr.min_stock - p.stock, 0) AS stock_gap,
  CASE
    WHEN p.stock <= 0 THEN 'critical'
    WHEN p.stock < irr.min_stock THEN 'warning'
    ELSE 'ok'
  END AS alert_level
FROM public.inventory_restock_rules irr
JOIN public.products p ON p.id = irr.product_id
WHERE irr.status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS mv_restock_alerts_pk
  ON public.mv_restock_alerts (rule_id);

CREATE OR REPLACE FUNCTION public.refresh_integration_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_products_for_sync;
  REFRESH MATERIALIZED VIEW public.mv_requisitions_for_bind;
  REFRESH MATERIALIZED VIEW public.mv_restock_alerts;
END;
$$;

-- ============================================================
-- 4. Index tuning
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_inventory_restock_rules_company_status
  ON public.inventory_restock_rules (company_id, status);

CREATE INDEX IF NOT EXISTS idx_requisition_templates_user_company
  ON public.requisition_templates (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_requisition_items_product
  ON public.requisition_items (product_id);

COMMIT;
