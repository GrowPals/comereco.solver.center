BEGIN;

-- ============================================================
-- Ensure pg_cron is available for scheduled refresh
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id integer;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'refresh_integration_views_job';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'refresh_integration_views_job',
  '*/5 * * * *',
  $$SELECT public.refresh_integration_views();$$
);

-- ============================================================
-- RPC: dequeue integration jobs with SKIP LOCKED
-- ============================================================
CREATE OR REPLACE FUNCTION public.dequeue_integration_jobs(
  p_target text DEFAULT 'bind',
  p_limit integer DEFAULT 20,
  p_worker uuid DEFAULT auth.uid()
)
RETURNS SETOF public.integration_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker uuid := COALESCE(p_worker, auth.uid(), gen_random_uuid());
BEGIN
  RETURN QUERY
  WITH jobs AS (
    SELECT id
    FROM public.integration_queue
    WHERE status = 'pending'
      AND target_system = p_target
      AND scheduled_at <= timezone('utc', now())
    ORDER BY priority, scheduled_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.integration_queue q
     SET status = 'processing',
         locked_at = timezone('utc', now()),
         locked_by = v_worker,
         attempts = q.attempts + 1
  FROM jobs
  WHERE q.id = jobs.id
  RETURNING q.*;
END;
$$;

-- ============================================================
-- RPC: complete integration job (success, error, retry)
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_integration_job(
  p_job_id uuid,
  p_status text,
  p_error text DEFAULT NULL,
  p_reschedule_at timestamptz DEFAULT NULL
)
RETURNS public.integration_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed text[] := ARRAY['pending','processing','success','error'];
  v_now timestamptz := timezone('utc', now());
  v_row public.integration_queue;
BEGIN
  IF NOT (p_status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid status %', p_status;
  END IF;

  UPDATE public.integration_queue
  SET status = p_status,
      last_error = CASE WHEN p_status = 'success' THEN NULL ELSE p_error END,
      locked_at = CASE WHEN p_status IN ('processing') THEN v_now ELSE NULL END,
      locked_by = CASE WHEN p_status IN ('processing') THEN locked_by ELSE NULL END,
      scheduled_at = CASE
        WHEN p_status = 'pending' THEN COALESCE(p_reschedule_at, v_now)
        ELSE scheduled_at
      END,
      updated_at = v_now
  WHERE id = p_job_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Integration job % not found', p_job_id;
  END IF;

  IF p_status IN ('success','error') THEN
    UPDATE public.integration_queue
    SET locked_at = NULL,
        locked_by = NULL
    WHERE id = p_job_id;
    v_row.locked_at := NULL;
    v_row.locked_by := NULL;
  END IF;

  RETURN v_row;
END;
$$;

COMMIT;
