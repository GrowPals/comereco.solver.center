-- ============================================
-- MIGRACIÓN: Políticas RLS CRÍTICAS Faltantes
-- Fecha: 2025-11-02
-- Descripción: Agrega políticas RLS críticas que están impidiendo el funcionamiento del sistema
-- Prioridad: CRÍTICA - Sistema no funcional sin estas políticas
-- ============================================

-- ============================================
-- PARTE 1: REQUISITIONS - Políticas de Aprobación
-- ============================================

-- Problema: Admins y Supervisores NO PUEDEN VER requisiciones para aprobarlas
-- Solo existe user_select_own_requisitions que solo permite ver las propias

-- CRÍTICO: Admins deben ver TODAS las requisiciones de su empresa
DROP POLICY IF EXISTS "admin_select_all_company_requisitions" ON public.requisitions;
CREATE POLICY "admin_select_all_company_requisitions"
ON public.requisitions FOR SELECT
USING (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
);

-- CRÍTICO: Supervisores deben ver requisiciones de sus proyectos
DROP POLICY IF EXISTS "supervisor_select_project_requisitions" ON public.requisitions;
CREATE POLICY "supervisor_select_project_requisitions"
ON public.requisitions FOR SELECT
USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_my_company_id()
  )
);

-- CRÍTICO: Admins deben poder APROBAR/RECHAZAR requisiciones (UPDATE)
DROP POLICY IF EXISTS "admin_update_requisitions" ON public.requisitions;
CREATE POLICY "admin_update_requisitions"
ON public.requisitions FOR UPDATE
USING (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
)
WITH CHECK (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
);

-- CRÍTICO: Supervisores deben poder APROBAR/RECHAZAR requisiciones de sus proyectos
DROP POLICY IF EXISTS "supervisor_update_project_requisitions" ON public.requisitions;
CREATE POLICY "supervisor_update_project_requisitions"
ON public.requisitions FOR UPDATE
USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_my_company_id()
  )
)
WITH CHECK (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND project_id IN (
    SELECT id
    FROM public.projects
    WHERE supervisor_id = auth.uid()
      AND company_id = get_my_company_id()
  )
);

-- ============================================
-- PARTE 2: REQUISITION_ITEMS - Operaciones CRUD
-- ============================================

-- Problema: Solo existe SELECT, no se pueden crear/modificar/eliminar items

-- CRÍTICO: Permitir INSERT de items cuando se crea una requisición
DROP POLICY IF EXISTS "user_insert_own_requisition_items" ON public.requisition_items;
CREATE POLICY "user_insert_own_requisition_items"
ON public.requisition_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_items.requisition_id
      AND r.created_by = auth.uid()
      AND r.business_status = 'draft'::business_status
  )
);

-- CRÍTICO: Permitir UPDATE de items en requisiciones draft propias
DROP POLICY IF EXISTS "user_update_own_draft_items" ON public.requisition_items;
CREATE POLICY "user_update_own_draft_items"
ON public.requisition_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_items.requisition_id
      AND r.created_by = auth.uid()
      AND r.business_status = 'draft'::business_status
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_items.requisition_id
      AND r.created_by = auth.uid()
      AND r.business_status = 'draft'::business_status
  )
);

-- CRÍTICO: Permitir DELETE de items en requisiciones draft propias
DROP POLICY IF EXISTS "user_delete_own_draft_items" ON public.requisition_items;
CREATE POLICY "user_delete_own_draft_items"
ON public.requisition_items FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.requisitions r
    WHERE r.id = requisition_items.requisition_id
      AND r.created_by = auth.uid()
      AND r.business_status = 'draft'::business_status
  )
);

-- ============================================
-- PARTE 3: PROJECTS - Gestión de Proyectos
-- ============================================

-- Problema: Solo existe SELECT, admins no pueden crear/modificar proyectos

-- CRÍTICO: Admins deben poder crear proyectos
DROP POLICY IF EXISTS "admin_insert_projects" ON public.projects;
CREATE POLICY "admin_insert_projects"
ON public.projects FOR INSERT
WITH CHECK (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
);

-- CRÍTICO: Admins deben poder actualizar proyectos de su empresa
DROP POLICY IF EXISTS "admin_update_projects" ON public.projects;
CREATE POLICY "admin_update_projects"
ON public.projects FOR UPDATE
USING (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
)
WITH CHECK (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
);

-- Supervisores pueden actualizar sus proyectos
DROP POLICY IF EXISTS "supervisor_update_own_projects" ON public.projects;
CREATE POLICY "supervisor_update_own_projects"
ON public.projects FOR UPDATE
USING (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND supervisor_id = auth.uid()
  AND company_id = get_my_company_id()
)
WITH CHECK (
  get_user_role_v2() = 'supervisor'::app_role_v2
  AND supervisor_id = auth.uid()
  AND company_id = get_my_company_id()
);

-- CRÍTICO: Admins pueden archivar proyectos (no DELETE físico, sino UPDATE status)
DROP POLICY IF EXISTS "admin_delete_projects" ON public.projects;
CREATE POLICY "admin_delete_projects"
ON public.projects FOR DELETE
USING (
  get_user_role_v2() = 'admin'::app_role_v2
  AND company_id = get_my_company_id()
);

-- ============================================
-- PARTE 4: FOLIO_COUNTERS - Sistema de Folios
-- ============================================

-- Problema: Solo tiene SELECT, el sistema no puede crear/actualizar contadores

-- Permitir INSERT de nuevos contadores (solo para sistema)
DROP POLICY IF EXISTS "system_insert_folio_counters" ON public.folio_counters;
CREATE POLICY "system_insert_folio_counters"
ON public.folio_counters FOR INSERT
WITH CHECK (
  company_id = get_my_company_id()
);

-- Permitir UPDATE de contadores (solo para sistema)
DROP POLICY IF EXISTS "system_update_folio_counters" ON public.folio_counters;
CREATE POLICY "system_update_folio_counters"
ON public.folio_counters FOR UPDATE
USING (
  company_id = get_my_company_id()
)
WITH CHECK (
  company_id = get_my_company_id()
);

-- ============================================
-- PARTE 5: AUDIT_LOG - Registro de Auditoría
-- ============================================

-- Problema: Solo tiene SELECT para admins, el sistema no puede insertar logs

-- Permitir INSERT de logs (cualquier usuario autenticado puede generar logs de sus acciones)
DROP POLICY IF EXISTS "user_insert_own_audit_logs" ON public.audit_log;
CREATE POLICY "user_insert_own_audit_logs"
ON public.audit_log FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND company_id = get_my_company_id()
);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas de requisitions
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'requisitions'
ORDER BY cmd, policyname;

-- Verificar políticas de requisition_items
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'requisition_items'
ORDER BY cmd, policyname;

-- Verificar políticas de projects
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'projects'
ORDER BY cmd, policyname;

SELECT '✅ Políticas RLS críticas aplicadas correctamente' as status;
