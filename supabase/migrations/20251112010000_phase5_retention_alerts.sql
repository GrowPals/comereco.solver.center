BEGIN;

-- ============================================================
-- 1. Retention helpers (audit_log & bind_sync_logs)
-- ============================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

ALTER TABLE public.bind_sync_logs
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.audit_log_archive (LIKE public.audit_log INCLUDING ALL);
ALTER TABLE public.audit_log_archive
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.audit_log_archive DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bind_sync_logs_archive (LIKE public.bind_sync_logs INCLUDING ALL);
ALTER TABLE public.bind_sync_logs_archive
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.bind_sync_logs_archive DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.archive_audit_log(p_before timestamptz DEFAULT timezone('utc', now()) - interval '90 days')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH moved AS (
    DELETE FROM public.audit_log
    WHERE "timestamp" < p_before
    RETURNING *, timezone('utc', now()) AS archived_at
  )
  INSERT INTO public.audit_log_archive
  SELECT moved.* FROM moved;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_bind_sync_logs(p_before timestamptz DEFAULT timezone('utc', now()) - interval '90 days')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH moved AS (
    DELETE FROM public.bind_sync_logs
    WHERE synced_at IS NOT NULL AND synced_at < p_before
    RETURNING *, timezone('utc', now()) AS archived_at
  )
  INSERT INTO public.bind_sync_logs_archive
  SELECT moved.* FROM moved;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 2. Drop legacy column
-- ============================================================
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS role;

-- ============================================================
-- 3. Operations dashboard view
-- ============================================================
DROP VIEW IF EXISTS public.mv_integration_dashboard;
CREATE VIEW public.mv_integration_dashboard AS
SELECT
  company_id,
  target_system,
  status,
  COUNT(*) AS jobs,
  MIN(scheduled_at) FILTER (WHERE status = 'pending') AS oldest_pending,
  MAX(updated_at) AS last_activity,
  MAX(last_error) FILTER (WHERE status = 'error') AS latest_error
FROM public.integration_queue
GROUP BY company_id, target_system, status;

-- ============================================================
-- 4. Restock alert hook
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_restock_alert(p_rule_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_job_id uuid;
  v_alert_level text;
BEGIN
  SELECT
    irr.*,
    p.stock,
    p.name AS product_name,
    p.sku AS product_sku
  INTO v_rule
  FROM public.inventory_restock_rules irr
  JOIN public.products p ON p.id = irr.product_id
  WHERE irr.id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Restock rule % no encontrada', p_rule_id;
  END IF;

  IF v_rule.stock <= 0 THEN
    v_alert_level := 'critical';
  ELSIF v_rule.stock < v_rule.min_stock THEN
    v_alert_level := 'warning';
  ELSE
    v_alert_level := 'ok';
  END IF;

  INSERT INTO public.integration_queue (
    company_id,
    entity_type,
    entity_id,
    target_system,
    payload,
    status,
    priority
  )
  VALUES (
    v_rule.company_id,
    'restock_rule',
    v_rule.id,
    'alert',
    jsonb_build_object(
      'rule_id', v_rule.id,
      'product_id', v_rule.product_id,
      'product_sku', v_rule.product_sku,
      'product_name', v_rule.product_name,
      'min_stock', v_rule.min_stock,
      'current_stock', v_rule.stock,
      'reorder_quantity', v_rule.reorder_quantity,
      'alert_level', v_alert_level
    ),
    'pending',
    4
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- ============================================================
-- 5. Fix get_user_company_id (remove row_security side effects)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT company_id
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

COMMIT;
