-- ===================================================================
-- MIGRACIÓN: Agregar can_submit_without_approval a profiles
-- Fecha: 2025-02-05
-- Descripción:
--   Añade una columna booleana para identificar usuarios autorizados
--   a enviar requisiciones sin aprobación previa. Valor por defecto: false.
-- ===================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS can_submit_without_approval boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.can_submit_without_approval IS
'Indica si el usuario puede enviar requisiciones sin requerir aprobación del supervisor.';

