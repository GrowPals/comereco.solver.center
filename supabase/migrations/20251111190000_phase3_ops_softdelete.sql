BEGIN;

-- ============================================================
-- 1. Soft-delete columns and indexes
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.requisitions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.requisition_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.user_cart_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Replace unique constraints on products with partial unique indexes
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_id_sku_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_company_id_bind_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS products_company_id_sku_unique
  ON public.products (company_id, sku)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_company_id_bind_id_unique
  ON public.products (company_id, bind_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_company_active
  ON public.products (company_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_company_active
  ON public.projects (company_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_requisitions_company_active
  ON public.requisitions (company_id, business_status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition_active
  ON public.requisition_items (requisition_id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 2. Soft delete helper & triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.soft_delete_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I.%I SET deleted_at = timezone(''utc'', now()) WHERE id = $1',
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME
  )
  USING OLD.id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS soft_delete_products ON public.products;
CREATE TRIGGER soft_delete_products
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_row();

DROP TRIGGER IF EXISTS soft_delete_projects ON public.projects;
CREATE TRIGGER soft_delete_projects
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_row();

DROP TRIGGER IF EXISTS soft_delete_requisitions ON public.requisitions;
CREATE TRIGGER soft_delete_requisitions
  BEFORE DELETE ON public.requisitions
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_row();

-- ============================================================
-- 3. Update RLS policies to ignore soft-deleted rows
-- ============================================================
DROP POLICY IF EXISTS products_select_access ON public.products;
CREATE POLICY products_select_access ON public.products
FOR SELECT
USING (
  deleted_at IS NULL AND (
    is_dev()
    OR is_platform_admin()
    OR (
      company_id = get_user_company_id()
      AND (is_admin() OR (is_active = true))
    )
  )
);

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products
FOR UPDATE
USING (deleted_at IS NULL AND is_admin() AND company_id = get_user_company_id())
WITH CHECK (deleted_at IS NULL AND is_admin() AND company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE
USING (deleted_at IS NULL AND is_admin() AND company_id = get_user_company_id());

DROP POLICY IF EXISTS projects_select_by_company ON public.projects;
CREATE POLICY projects_select_by_company ON public.projects
FOR SELECT
USING (deleted_at IS NULL AND (is_dev() OR is_platform_admin() OR company_id = get_user_company_id()));

DROP POLICY IF EXISTS projects_update_manage ON public.projects;
CREATE POLICY projects_update_manage ON public.projects
FOR UPDATE
USING (deleted_at IS NULL AND project_update_guard(company_id, supervisor_id))
WITH CHECK (deleted_at IS NULL AND project_update_guard(company_id, supervisor_id));

DROP POLICY IF EXISTS projects_delete_manage ON public.projects;
CREATE POLICY projects_delete_manage ON public.projects
FOR DELETE
USING (deleted_at IS NULL AND project_delete_guard(company_id));

DROP POLICY IF EXISTS requisitions_select_unified ON public.requisitions;
CREATE POLICY requisitions_select_unified ON public.requisitions
FOR SELECT
USING (
  deleted_at IS NULL AND (
    is_dev()
    OR is_platform_admin()
    OR (
      company_id = get_user_company_id()
      AND (
        is_admin()
        OR created_by = auth.uid()
        OR (
          is_supervisor()
          AND project_id IN (
            SELECT id FROM public.projects WHERE supervisor_id = auth.uid()
          )
        )
      )
    )
  )
);

DROP POLICY IF EXISTS requisitions_update_manage ON public.requisitions;
CREATE POLICY requisitions_update_manage ON public.requisitions
FOR UPDATE
USING (deleted_at IS NULL AND requisition_update_guard(company_id, created_by, business_status))
WITH CHECK (deleted_at IS NULL AND requisition_update_guard(company_id, created_by, business_status));

-- ============================================================
-- 4. Ops automation helper + integration queue policies
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_ops_automation()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  RETURN v_role = 'ops_automation' OR public.is_platform_admin();
END;
$$;

DROP POLICY IF EXISTS integration_queue_select_company ON public.integration_queue;
CREATE POLICY integration_queue_select_company ON public.integration_queue
FOR SELECT
USING (
  is_ops_automation()
  OR is_platform_admin()
  OR company_id = get_user_company_id()
);

DROP POLICY IF EXISTS integration_queue_mutate_company ON public.integration_queue;
CREATE POLICY integration_queue_mutate_company ON public.integration_queue
FOR ALL
USING (
  is_ops_automation()
  OR is_platform_admin()
  OR (company_id = get_user_company_id() AND is_admin())
)
WITH CHECK (
  is_ops_automation()
  OR is_platform_admin()
  OR (company_id = get_user_company_id() AND is_admin())
);

-- ============================================================
-- 5. Refresh materialized views (filters out soft-deleted rows)
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
LEFT JOIN last_event le ON le.product_id = p.id
WHERE p.deleted_at IS NULL;

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
LEFT JOIN last_event le ON le.requisition_id = r.id
WHERE r.deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS mv_requisitions_for_bind_pk
  ON public.mv_requisitions_for_bind (requisition_id);

COMMIT;
