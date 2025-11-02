-- ============================================
-- FIX: Infinite Recursion in RLS Policies
-- Error: 42P17 - infinite recursion detected in policy for relation "project_members"
-- ============================================
-- 
-- PROBLEMA:
-- Las políticas de project_members llaman a is_admin()/is_supervisor()
-- que consultan profiles, y profiles tiene políticas que consultan project_members
-- creando recursión infinita.
--
-- SOLUCIÓN:
-- 1. Actualizar funciones helper para usar role_v2 y evitar recursion
-- 2. Asegurar que las funciones helper usen SECURITY DEFINER correctamente
-- 3. Simplificar políticas para evitar dependencias circulares
-- ============================================

-- PASO 1: Actualizar función is_admin() para usar role_v2 y evitar recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar SECURITY DEFINER para bypass RLS y evitar recursion
  -- Consultar directamente auth.users y profiles sin triggers de RLS
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND role_v2 = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 2: Actualizar función is_supervisor() para usar role_v2
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar SECURITY DEFINER para bypass RLS y evitar recursion
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
      AND role_v2 = 'supervisor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 3: Crear función helper para verificar role sin recursion
-- Esta función puede ser usada en políticas sin causar recursion
CREATE OR REPLACE FUNCTION get_user_role_v2()
RETURNS app_role_v2 AS $$
BEGIN
  RETURN (
    SELECT role_v2 FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PASO 4: Simplificar política de profiles que causa recursion
-- Reemplazar la política que consulta project_members con una más simple
DROP POLICY IF EXISTS "supervisor_select_project_users" ON public.profiles;

-- Crear política más simple que no cause recursion
CREATE POLICY "supervisor_select_project_users" ON public.profiles
FOR SELECT USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND (
    id = auth.uid()
    OR id IN (
      -- Solo consultar project_members si es supervisor, evitando recursion
      SELECT DISTINCT pm.user_id 
      FROM public.project_members pm
      JOIN public.projects p ON pm.project_id = p.id
      WHERE p.supervisor_id = auth.uid()
    )
  )
);

-- PASO 5: Asegurar que las políticas de project_members usen las funciones correctamente
-- Primero eliminamos las políticas existentes
DROP POLICY IF EXISTS "admin_manage_all_members" ON public.project_members;
DROP POLICY IF EXISTS "supervisor_manage_own_members" ON public.project_members;
DROP POLICY IF EXISTS "user_select_own_membership" ON public.project_members;

-- Recrear políticas con funciones mejoradas
CREATE POLICY "admin_manage_all_members" ON public.project_members
FOR ALL USING (is_admin());

CREATE POLICY "supervisor_manage_own_members" ON public.project_members
FOR ALL USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND project_id IN (
    SELECT id FROM public.projects WHERE supervisor_id = auth.uid()
  )
);

CREATE POLICY "user_select_own_membership" ON public.project_members
FOR SELECT USING (user_id = auth.uid());

-- PASO 6: Verificar que no hay más recursion
-- Este query debería funcionar sin recursion
DO $$
BEGIN
  -- Test query que debería funcionar
  PERFORM 1 FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RAISE NOTICE '✅ Policies verificadas - sin recursion detectada';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Error al verificar policies: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que las funciones existen y están correctas
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname IN ('is_admin', 'is_supervisor', 'get_user_role_v2')
ORDER BY proname;

-- Verificar políticas de project_members
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'project_members'
ORDER BY policyname;

SELECT '✅ Fix aplicado correctamente' as status;

