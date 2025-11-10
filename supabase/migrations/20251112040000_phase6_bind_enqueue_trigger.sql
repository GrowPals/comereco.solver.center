BEGIN;

-- ============================================================
-- Ensure requisitions automatically enter the integration queue
-- whenever their integration_status flips to pending_sync.
-- This trigger was missing even though the function exists.
-- ============================================================

DROP TRIGGER IF EXISTS trigger_enqueue_for_bind ON public.requisitions;

CREATE TRIGGER trigger_enqueue_for_bind
AFTER UPDATE OF integration_status ON public.requisitions
FOR EACH ROW
WHEN (
    NEW.integration_status = 'pending_sync'
    AND (OLD.integration_status IS DISTINCT FROM NEW.integration_status)
)
EXECUTE FUNCTION public.enqueue_requisition_for_bind();

COMMIT;
