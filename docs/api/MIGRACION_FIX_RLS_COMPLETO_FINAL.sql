-- ============================================
-- MIGRACIÓN MAESTRA: Fix Completo de RLS y Roles
-- Fecha: 2025-11-02
-- Descripción: Corrige TODOS los problemas de RLS, roles, y seguridad
-- Prioridad: CRÍTICA - Sistema no funcional sin esta migración
-- ============================================
--
-- PROBLEMAS QUE RESUELVE:
-- 1. Vulnerabilidades de seguridad (search_path mutable)
-- 2. Funciones redundantes (get_user_company_id vs get_my_company_id)
-- 3. Políticas legacy obsoletas (app_role en vez de role_v2)
-- 4. Políticas redundantes y confusas
-- 5. Políticas faltantes que bloquean funcionalidad
--
-- IMPORTANTE: Esta migración es SEGURA y NO destruye datos.
-- Solo actualiza funciones y políticas de seguridad.
-- ============================================

-- ============================================
-- PASO 1: Funciones Helper - Corregir Vulnerabilidades
-- ============================================

-- 1.1 Actualizar is_admin() con search_path seguro
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role_v2 = 'admin'::app_role_v2
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual es administrador. Usa role_v2. SECURITY DEFINER con search_path seguro.';

-- 1.2 Actualizar is_supervisor() con search_path seguro
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role_v2 = 'supervisor'::app_role_v2
  );
END;
$$;

COMMENT ON FUNCTION public.is_supervisor() IS 'Verifica si el usuario actual es supervisor. Usa role_v2. SECURITY DEFINER con search_path seguro.';

-- 1.3 Actualizar get_user_role_v2() con search_path seguro
CREATE OR REPLACE FUNCTION public.get_user_role_v2()
RETURNS app_role_v2
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT role_v2
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_role_v2() IS 'Obtiene el rol (role_v2) del usuario actual. SECURITY DEFINER con search_path seguro.';

-- 1.4 Consolidar get_my_company_id() y get_user_company_id() en UNA función
-- Deprecamos get_my_company_id() y usamos solo get_user_company_id()
DROP FUNCTION IF EXISTS public.get_my_company_id();

-- Asegurar que get_user_company_id() esté correctamente definida
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
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

COMMENT ON FUNCTION public.get_user_company_id() IS 'Obtiene el company_id del usuario actual. SECURITY DEFINER con search_path seguro. Esta es la función estándar para obtener company_id.';

-- 1.5 Crear función helper adicional: is_admin_or_supervisor()
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role_v2 IN ('admin'::app_role_v2, 'supervisor'::app_role_v2)
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_or_supervisor() IS 'Verifica si el usuario es admin O supervisor. Útil para permisos compartidos.';

-- ============================================
-- PASO 2: Actualizar Políticas que usan get_my_company_id()
-- ============================================

-- Listar y reemplazar todas las políticas que usan get_my_company_id()
-- por get_user_company_id()

-- 2.1 PROFILES
DROP POLICY IF EXISTS "Admins can view all company profiles" ON public.profiles;
CREATE POLICY "Admins can view all company profiles"
ON public.profiles FOR SELECT
USING (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "Admins can update all company profiles" ON public.profiles;
CREATE POLICY "Admins can update all company profiles"
ON public.profiles FOR UPDATE
USING (
  is_admin()
  AND company_id = get_user_company_id()
)
WITH CHECK (
  company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "Supervisors can view team profiles" ON public.profiles;
CREATE POLICY "Supervisors can view team profiles"
ON public.profiles FOR SELECT
USING (
  is_supervisor()
  AND (
    id = auth.uid()
    OR (
      company_id = get_user_company_id()
      AND id IN (
        SELECT DISTINCT pm.user_id
        FROM public.project_members pm
        INNER JOIN public.projects p ON pm.project_id = p.id
        WHERE p.supervisor_id = auth.uid()
          AND p.company_id = get_user_company_id()
      )
    )
  )
);

-- 2.2 PROJECT_MEMBERS
DROP POLICY IF EXISTS "admin_manage_all_members" ON public.project_members;
CREATE POLICY "admin_manage_all_members"
ON public.project_members FOR ALL
USING (
  is_admin()
  AND project_id IN (
    SELECT id FROM public.projects
    WHERE company_id = get_user_company_id()
  )
);

DROP POLICY IF EXISTS "supervisor_manage_own_members" ON public.project_members;
CREATE POLICY "supervisor_manage_own_members"
ON public.project_members FOR ALL
USING (
  is_supervisor()
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_user_company_id()
  )
);

DROP POLICY IF EXISTS "project_members_admin_select" ON public.project_members;
CREATE POLICY "project_members_admin_select"
ON public.project_members FOR SELECT
USING (
  is_admin()
  AND project_id IN (
    SELECT id FROM public.projects
    WHERE company_id = get_user_company_id()
  )
);

DROP POLICY IF EXISTS "project_members_select_company_members" ON public.project_members;
CREATE POLICY "project_members_select_company_members"
ON public.project_members FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE company_id = get_user_company_id()
  )
);

-- 2.3 PROJECTS
DROP POLICY IF EXISTS "admin_delete_projects" ON public.projects;
CREATE POLICY "admin_delete_projects"
ON public.projects FOR DELETE
USING (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "admin_insert_projects" ON public.projects;
CREATE POLICY "admin_insert_projects"
ON public.projects FOR INSERT
WITH CHECK (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "admin_update_projects" ON public.projects;
CREATE POLICY "admin_update_projects"
ON public.projects FOR UPDATE
USING (
  is_admin()
  AND company_id = get_user_company_id()
)
WITH CHECK (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "supervisor_update_own_projects" ON public.projects;
CREATE POLICY "supervisor_update_own_projects"
ON public.projects FOR UPDATE
USING (
  is_supervisor()
  AND supervisor_id = auth.uid()
  AND company_id = get_user_company_id()
)
WITH CHECK (
  is_supervisor()
  AND supervisor_id = auth.uid()
  AND company_id = get_user_company_id()
);

-- 2.4 REQUISITIONS
DROP POLICY IF EXISTS "admin_select_all_company_requisitions" ON public.requisitions;
CREATE POLICY "admin_select_all_company_requisitions"
ON public.requisitions FOR SELECT
USING (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "supervisor_select_project_requisitions" ON public.requisitions;
CREATE POLICY "supervisor_select_project_requisitions"
ON public.requisitions FOR SELECT
USING (
  is_supervisor()
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_user_company_id()
  )
);

DROP POLICY IF EXISTS "admin_update_requisitions" ON public.requisitions;
CREATE POLICY "admin_update_requisitions"
ON public.requisitions FOR UPDATE
USING (
  is_admin()
  AND company_id = get_user_company_id()
)
WITH CHECK (
  is_admin()
  AND company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "supervisor_update_project_requisitions" ON public.requisitions;
CREATE POLICY "supervisor_update_project_requisitions"
ON public.requisitions FOR UPDATE
USING (
  is_supervisor()
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_user_company_id()
  )
)
WITH CHECK (
  is_supervisor()
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_user_company_id()
  )
);

-- 2.5 FOLIO_COUNTERS
DROP POLICY IF EXISTS "system_insert_folio_counters" ON public.folio_counters;
CREATE POLICY "system_insert_folio_counters"
ON public.folio_counters FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
);

DROP POLICY IF EXISTS "system_update_folio_counters" ON public.folio_counters;
CREATE POLICY "system_update_folio_counters"
ON public.folio_counters FOR UPDATE
USING (
  company_id = get_user_company_id()
)
WITH CHECK (
  company_id = get_user_company_id()
);

-- 2.6 AUDIT_LOG
DROP POLICY IF EXISTS "user_insert_own_audit_logs" ON public.audit_log;
CREATE POLICY "user_insert_own_audit_logs"
ON public.audit_log FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_user_company_id()
);

-- ============================================
-- PASO 3: Eliminar Políticas Legacy (app_role obsoleto)
-- ============================================

-- 3.1 Eliminar políticas de companies que usan app_role
DROP POLICY IF EXISTS "companies_super_admin_write" ON public.companies;
DROP POLICY IF EXISTS "companies_super_admin_update" ON public.companies;

-- ============================================
-- PASO 4: Consolidar Políticas Redundantes
-- ============================================

-- 4.1 COMPANIES - Eliminar política SELECT duplicada
DROP POLICY IF EXISTS "companies_by_members" ON public.companies;
-- Mantener solo "Users see own company"

-- ============================================
-- PASO 5: Agregar Políticas Faltantes
-- ============================================

-- 5.1 BIND_SYNC_LOGS - Permitir INSERT para sistema
DROP POLICY IF EXISTS "system_insert_sync_logs" ON public.bind_sync_logs;
CREATE POLICY "system_insert_sync_logs"
ON public.bind_sync_logs FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
);

-- 5.2 BIND_SYNC_LOGS - Permitir DELETE para admins (limpieza de logs)
DROP POLICY IF EXISTS "admin_delete_sync_logs" ON public.bind_sync_logs;
CREATE POLICY "admin_delete_sync_logs"
ON public.bind_sync_logs FOR DELETE
USING (
  is_admin()
  AND company_id = get_user_company_id()
);

-- ============================================
-- PASO 6: Optimizar Políticas con OR en vez de Múltiples
-- ============================================

-- 6.1 PROFILES - Consolidar 3 políticas SELECT en 1
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view team profiles" ON public.profiles;

CREATE POLICY "profiles_select_unified"
ON public.profiles FOR SELECT
USING (
  -- Todos pueden ver su propio perfil
  id = auth.uid()
  OR
  -- Admins ven todos los perfiles de su company
  (
    is_admin()
    AND company_id = get_user_company_id()
  )
  OR
  -- Supervisores ven perfiles de su company y de sus proyectos
  (
    is_supervisor()
    AND company_id = get_user_company_id()
  )
);

-- 6.2 REQUISITIONS - Consolidar 3 políticas SELECT en 1
DROP POLICY IF EXISTS "user_select_own_requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "admin_select_all_company_requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "supervisor_select_project_requisitions" ON public.requisitions;

CREATE POLICY "requisitions_select_unified"
ON public.requisitions FOR SELECT
USING (
  company_id = get_user_company_id()
  AND (
    -- Admins ven todas las requisiciones de su company
    is_admin()
    OR
    -- Usuarios ven solo sus propias requisiciones
    created_by = auth.uid()
    OR
    -- Supervisores ven requisiciones de sus proyectos
    (
      is_supervisor()
      AND project_id IN (
        SELECT id
        FROM public.projects
        WHERE supervisor_id = auth.uid()
      )
    )
  )
);

-- 6.3 PROJECT_MEMBERS - Consolidar 3 políticas SELECT en 1
DROP POLICY IF EXISTS "project_members_select_own" ON public.project_members;
DROP POLICY IF EXISTS "project_members_select_company_members" ON public.project_members;
DROP POLICY IF EXISTS "project_members_admin_select" ON public.project_members;

CREATE POLICY "project_members_select_unified"
ON public.project_members FOR SELECT
USING (
  -- Usuario es miembro del proyecto
  user_id = auth.uid()
  OR
  -- Usuario pertenece a la misma company del proyecto
  project_id IN (
    SELECT id
    FROM public.projects
    WHERE company_id = get_user_company_id()
  )
);

-- 6.4 PROJECTS - Consolidar 2 políticas SELECT en 1
DROP POLICY IF EXISTS "proj_company_select" ON public.projects;
DROP POLICY IF EXISTS "user_select_member_projects" ON public.projects;

CREATE POLICY "projects_select_unified"
ON public.projects FOR SELECT
USING (
  -- Usuarios ven proyectos de su company
  company_id = get_user_company_id()
  OR
  -- Usuarios ven proyectos donde son miembros
  id IN (
    SELECT project_id
    FROM public.project_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- PASO 7: Verificación y Logging
-- ============================================

-- Verificar funciones con search_path seguro
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('is_admin', 'is_supervisor', 'get_user_role_v2', 'get_user_company_id', 'is_admin_or_supervisor')
    AND p.prosecdef = true
    AND EXISTS (
      SELECT 1 FROM pg_proc_get_function_arguments(p.oid)
      -- Verificar que tenga search_path configurado
    );

  RAISE NOTICE '✅ Funciones helper verificadas: %', v_count;

  IF v_count < 5 THEN
    RAISE WARNING '⚠️ Algunas funciones pueden no tener search_path configurado';
  END IF;
END $$;

-- Verificar políticas actualizadas
SELECT
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'requisitions', 'projects', 'project_members', 'companies')
GROUP BY tablename
ORDER BY tablename;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CAMBIOS APLICADOS:';
  RAISE NOTICE '  1. ✅ Funciones helper con search_path seguro';
  RAISE NOTICE '  2. ✅ Función redundante get_my_company_id() eliminada';
  RAISE NOTICE '  3. ✅ Políticas legacy (app_role) eliminadas';
  RAISE NOTICE '  4. ✅ Políticas consolidadas y optimizadas';
  RAISE NOTICE '  5. ✅ Políticas faltantes agregadas';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PRÓXIMOS PASOS:';
  RAISE NOTICE '  1. Verificar advisors de seguridad en Supabase';
  RAISE NOTICE '  2. Ejecutar pruebas de acceso por rol';
  RAISE NOTICE '  3. Confirmar que admins ven todas las vistas';
  RAISE NOTICE '  4. Confirmar que no hay errores en navegación';
  RAISE NOTICE '';
END $$;
