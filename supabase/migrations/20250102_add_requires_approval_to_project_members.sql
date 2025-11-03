-- ============================================
-- Migration: Add requires_approval to project_members
-- Date: 2025-01-02
-- Description: Agrega el campo requires_approval a project_members para permitir
--              que supervisores configuren si los usuarios necesitan aprobación
--              antes de enviar requisiciones.
-- ============================================

-- PASO 1: Agregar columna requires_approval
-- Default: true (para seguridad, por defecto requiere aprobación)
ALTER TABLE public.project_members
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT true;

-- PASO 2: Agregar comentario descriptivo
COMMENT ON COLUMN public.project_members.requires_approval IS
'Indica si el usuario requiere aprobación del supervisor antes de enviar requisiciones. Si es false, las requisiciones se aprueban automáticamente.';

-- PASO 3: Crear índice para mejorar performance en queries que filtran por este campo
CREATE INDEX IF NOT EXISTS idx_project_members_requires_approval
ON public.project_members(requires_approval);

-- PASO 4: Crear índice compuesto para optimizar queries comunes
-- Este índice ayuda a encontrar rápidamente usuarios que requieren aprobación en un proyecto
CREATE INDEX IF NOT EXISTS idx_project_members_project_requires_approval
ON public.project_members(project_id, requires_approval)
WHERE requires_approval = true;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que la columna fue agregada
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_members'
      AND column_name = 'requires_approval'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE '✅ Columna requires_approval agregada exitosamente';
  ELSE
    RAISE EXCEPTION '❌ Error: Columna requires_approval no fue agregada';
  END IF;
END $$;

-- Verificar índices
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'project_members'
    AND indexname IN ('idx_project_members_requires_approval', 'idx_project_members_project_requires_approval');

  IF index_count = 2 THEN
    RAISE NOTICE '✅ Índices creados exitosamente';
  ELSE
    RAISE WARNING '⚠️ Se esperaban 2 índices, se crearon %', index_count;
  END IF;
END $$;

-- ============================================
-- DATOS DE EJEMPLO (Opcional - comentado)
-- ============================================

-- Si quieres marcar ciertos usuarios como que NO requieren aprobación:
-- UPDATE public.project_members
-- SET requires_approval = false
-- WHERE user_id IN (
--   SELECT id FROM public.profiles WHERE role_v2 = 'supervisor'
-- );

-- ============================================
-- ROLLBACK (Si necesitas revertir)
-- ============================================

-- Para revertir esta migración, ejecuta:
-- DROP INDEX IF EXISTS public.idx_project_members_project_requires_approval;
-- DROP INDEX IF EXISTS public.idx_project_members_requires_approval;
-- ALTER TABLE public.project_members DROP COLUMN IF EXISTS requires_approval;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Ver estructura actualizada de project_members
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'project_members'
ORDER BY ordinal_position;

-- Ver miembros que requieren aprobación
-- SELECT
--   pm.project_id,
--   pm.user_id,
--   p.full_name,
--   pm.requires_approval,
--   proj.name as project_name
-- FROM public.project_members pm
-- JOIN public.profiles p ON pm.user_id = p.id
-- JOIN public.projects proj ON pm.project_id = proj.id
-- WHERE pm.requires_approval = true;
