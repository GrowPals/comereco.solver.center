BEGIN;

-- ============================================================
-- RPC: log_bind_sync_event
-- Centralized helper for n8n to append logs to bind_sync_logs
-- and keep timestamps consistent. Returns the inserted row so
-- callers can chain data without extra SELECTs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_bind_sync_event(
  p_company_id uuid,
  p_sync_type text DEFAULT 'requisition',
  p_entity_type text DEFAULT 'requisition',
  p_entity_id uuid DEFAULT NULL,
  p_status text DEFAULT 'pending',
  p_bind_id text DEFAULT NULL,
  p_request_payload jsonb DEFAULT NULL,
  p_response_payload jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS public.bind_sync_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed_status CONSTANT text[] := ARRAY['pending','success','failed','error'];
  v_allowed_sync   CONSTANT text[] := ARRAY['requisition','products','manual'];
  v_row public.bind_sync_logs;
BEGIN
  IF p_status IS NULL OR NOT (p_status = ANY (v_allowed_status)) THEN
    RAISE EXCEPTION 'Invalid status %. Allowed: %', p_status, v_allowed_status;
  END IF;

  IF p_sync_type IS NULL OR NOT (p_sync_type = ANY (v_allowed_sync)) THEN
    RAISE EXCEPTION 'Invalid sync_type %. Allowed: %', p_sync_type, v_allowed_sync;
  END IF;

  INSERT INTO public.bind_sync_logs (
    company_id,
    sync_type,
    entity_type,
    entity_id,
    bind_id,
    status,
    request_payload,
    response_payload,
    error_message,
    synced_at,
    created_at,
    updated_at
  )
  VALUES (
    p_company_id,
    p_sync_type,
    COALESCE(p_entity_type, 'requisition'),
    p_entity_id,
    p_bind_id,
    p_status,
    p_request_payload,
    p_response_payload,
    p_error_message,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.log_bind_sync_event IS 'Helper used by n8n/BIND workflows to persist sync attempts in bind_sync_logs with consistent timestamps.';

COMMIT;
