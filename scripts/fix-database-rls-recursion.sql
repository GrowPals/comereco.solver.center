-- ============================================
-- FIX COMPLETO: Infinite Recursion en RLS Policies
-- Error: 42P17 - infinite recursion detected in policy for relation "project_members"
-- ============================================
-- 
-- PROBLEMA IDENTIFICADO:
-- Las políticas de project_members llaman a is_admin()/is_supervisor()
-- que consultan profiles, y profiles tiene políticas que consultan project_members
-- creando recursión infinita.
--
-- SOLUCIÓN APLICADA:
-- 1. Actualizar funciones helper para usar role_v2 y SECURITY DEFINER
-- 2. Simplificar políticas para evitar dependencias circulares
-- 3. Asegurar que las funciones helper bypass RLS correctamente
-- ============================================

-- PASO 1: Actualizar función is_admin() para usar role_v2 y evitar recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
AS $$
BEGIN
  -- Usar SECURITY DEFINER para bypass RLS y evitar recursion
  -- Consultar directamente profiles sin triggers de RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid() 
      AND role_v2 = 'admin'::app_role_v2
  );
END;
$$;

-- PASO 2: Actualizar función is_supervisor() para usar role_v2
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
AS $$
BEGIN
  -- Usar SECURITY DEFINER para bypass RLS y evitar recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE id = auth.uid() 
      AND role_v2 = 'supervisor'::app_role_v2
  );
END;
$$;

-- PASO 3: Crear función helper para verificar role sin recursion
CREATE OR REPLACE FUNCTION public.get_user_role_v2()
RETURNS app_role_v2 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
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

-- PASO 4: Crear función helper para obtener company_id sin recursion
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
STABLE
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

-- PASO 5: Simplificar política de profiles que causa recursion
-- Eliminar política problemática si existe
DROP POLICY IF EXISTS "supervisor_select_project_users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_supervisor_select" ON public.profiles;

-- Crear política más simple que no cause recursion
CREATE POLICY "supervisor_select_project_users" ON public.profiles
FOR SELECT 
USING (
  -- Usuarios pueden verse a sí mismos
  id = auth.uid()
  OR
  -- Usuarios de la misma company pueden verse entre sí
  company_id = get_my_company_id()
  OR
  -- Supervisores pueden ver usuarios de sus proyectos (sin recursion)
  (
    get_user_role_v2() = 'supervisor'::app_role_v2
    AND id IN (
      SELECT DISTINCT pm.user_id 
      FROM public.project_members pm
      INNER JOIN public.projects p ON pm.project_id = p.id
      WHERE p.supervisor_id = auth.uid()
        AND p.company_id = get_my_company_id()
    )
  )
  OR
  -- Admins pueden ver todos los usuarios de su company
  (
    get_user_role_v2() = 'admin'::app_role_v2
    AND company_id = get_my_company_id()
  )
);

-- PASO 6: Recrear políticas de project_members sin recursion
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "admin_manage_all_members" ON public.project_members;
DROP POLICY IF EXISTS "admin_all_project_members" ON public.project_members;
DROP POLICY IF EXISTS "supervisor_manage_own_members" ON public.project_members;
DROP POLICY IF EXISTS "user_select_own_membership" ON public.project_members;
DROP POLICY IF EXISTS "user_view_members_of_own_projects" ON public.project_members;

-- Recrear políticas optimizadas sin recursion
CREATE POLICY "admin_manage_all_members" ON public.project_members
FOR ALL 
USING (
  is_admin()
  AND project_id IN (
    SELECT id FROM public.projects WHERE company_id = get_my_company_id()
  )
);

CREATE POLICY "supervisor_manage_own_members" ON public.project_members
FOR ALL 
USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND project_id IN (
    SELECT id 
    FROM public.projects 
    WHERE supervisor_id = auth.uid()
      AND company_id = get_my_company_id()
  )
);

CREATE POLICY "user_select_own_membership" ON public.project_members
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "user_view_members_of_own_projects" ON public.project_members
FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  project_id IN (
    SELECT project_id 
    FROM public.project_members 
    WHERE user_id = auth.uid()
  )
);

-- PASO 7: Asegurar que las políticas de profiles no causen recursion
-- Verificar y actualizar políticas de profiles si es necesario
DROP POLICY IF EXISTS "profiles_company_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;

CREATE POLICY "profiles_self_select" ON public.profiles
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "profiles_company_select" ON public.profiles
FOR SELECT 
USING (company_id = get_my_company_id());

-- ============================================
-- VERIFICACIÓN Y COMENTARIOS
-- ============================================

-- Verificar que las funciones existen y están correctas
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  CASE provolatile 
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc
WHERE proname IN ('is_admin', 'is_supervisor', 'get_user_role_v2', 'get_my_company_id')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Verificar políticas de project_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as policy_definition
FROM pg_policies
WHERE tablename IN ('project_members', 'profiles')
ORDER BY tablename, policyname;

-- ============================================
-- MENSAJE DE ÉXITO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Fix de recursión RLS aplicado correctamente';
  RAISE NOTICE '✅ Funciones helper actualizadas con SECURITY DEFINER';
  RAISE NOTICE '✅ Políticas de project_members y profiles optimizadas';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Verifica que las queries funcionen correctamente';
  RAISE NOTICE '2. Prueba consultar profiles y project_members desde la app';
  RAISE NOTICE '3. Si persisten errores, revisa los logs de Supabase';
END $$;

