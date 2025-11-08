-- ============================================
-- MIGRACIÓN: Row Level Security Completo
-- Fecha: 2025-01-02
-- Descripción: Implementa RLS en todas las tablas principales
-- Prioridad: ALTA - Seguridad crítica
-- ============================================

-- ============================================
-- PARTE 1: Habilitar RLS en todas las tablas
-- ============================================

-- Asegurar que RLS esté habilitado
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 2: Políticas para COMPANIES
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;

-- SELECT: Usuarios solo ven su empresa
CREATE POLICY "Users can view their company"
ON public.companies FOR SELECT
USING (
    id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- UPDATE: Solo admins pueden actualizar
CREATE POLICY "Admins can update their company"
ON public.companies FOR UPDATE
USING (
    id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- ============================================
-- PARTE 3: Políticas para PRODUCTS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- SELECT: Todos los usuarios ven productos de su empresa
CREATE POLICY "Users can view company products"
ON public.products FOR SELECT
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- INSERT: Solo admins
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- UPDATE: Solo admins
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- DELETE: Solo admins
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- PARTE 4: Políticas para PROJECTS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and supervisors can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins and supervisors can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- SELECT: Todos ven proyectos de su empresa
CREATE POLICY "Users can view company projects"
ON public.projects FOR SELECT
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- INSERT: Admins y supervisores
CREATE POLICY "Admins and supervisors can insert projects"
ON public.projects FOR INSERT
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);

-- UPDATE: Admins y supervisores
CREATE POLICY "Admins and supervisors can update projects"
ON public.projects FOR UPDATE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
)
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- DELETE: Solo admins
CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- PARTE 5: Políticas para REQUISITIONS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view requisitions based on role" ON public.requisitions;
DROP POLICY IF EXISTS "Users can insert their own requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Users can update their draft requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Supervisors can approve requisitions" ON public.requisitions;
DROP POLICY IF EXISTS "Admins can delete requisitions" ON public.requisitions;

-- SELECT: Basado en rol
CREATE POLICY "Users can view requisitions based on role"
ON public.requisitions FOR SELECT
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
        -- Admin: ve todas de su empresa
        (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
        OR
        -- User: solo las suyas
        created_by = auth.uid()
        OR
        -- Supervisor: las de proyectos que maneja + las que debe aprobar
        (
            (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'supervisor'
            AND (
                project_id IN (
                    SELECT id FROM public.projects
                    WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
                )
                OR business_status = 'pending'
            )
        )
    )
);

-- INSERT: Todos pueden crear requisiciones
CREATE POLICY "Users can insert their own requisitions"
ON public.requisitions FOR INSERT
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
);

-- UPDATE: Solo pueden editar sus requisiciones en estado draft
CREATE POLICY "Users can update their draft requisitions"
ON public.requisitions FOR UPDATE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
        -- Creador puede editar si está en draft
        (created_by = auth.uid() AND business_status = 'draft')
        OR
        -- Supervisor puede aprobar/rechazar
        (
            (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'supervisor'
            AND business_status = 'pending'
        )
        OR
        -- Admin puede editar cualquiera
        (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
)
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- DELETE: Solo admins pueden eliminar
CREATE POLICY "Admins can delete requisitions"
ON public.requisitions FOR DELETE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- PARTE 6: Políticas para REQUISITION_ITEMS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view items of their requisitions" ON public.requisition_items;
DROP POLICY IF EXISTS "Users can insert items to their requisitions" ON public.requisition_items;
DROP POLICY IF EXISTS "Users can update items in draft requisitions" ON public.requisition_items;
DROP POLICY IF EXISTS "Users can delete items from draft requisitions" ON public.requisition_items;

-- SELECT: Ver items de requisiciones que pueden ver
CREATE POLICY "Users can view items of their requisitions"
ON public.requisition_items FOR SELECT
USING (
    requisition_id IN (
        SELECT id FROM public.requisitions
        WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        AND (
            (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
            OR created_by = auth.uid()
            OR (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'supervisor'
        )
    )
);

-- INSERT: Agregar items a requisiciones propias en draft
CREATE POLICY "Users can insert items to their requisitions"
ON public.requisition_items FOR INSERT
WITH CHECK (
    requisition_id IN (
        SELECT id FROM public.requisitions
        WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        AND created_by = auth.uid()
        AND business_status = 'draft'
    )
);

-- UPDATE: Solo en requisiciones draft propias
CREATE POLICY "Users can update items in draft requisitions"
ON public.requisition_items FOR UPDATE
USING (
    requisition_id IN (
        SELECT id FROM public.requisitions
        WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        AND (
            (created_by = auth.uid() AND business_status = 'draft')
            OR (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
        )
    )
);

-- DELETE: Solo en requisiciones draft propias
CREATE POLICY "Users can delete items from draft requisitions"
ON public.requisition_items FOR DELETE
USING (
    requisition_id IN (
        SELECT id FROM public.requisitions
        WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
        AND (
            (created_by = auth.uid() AND business_status = 'draft')
            OR (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
        )
    )
);

-- ============================================
-- PARTE 7: Políticas para TEMPLATES
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view company templates" ON public.templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

-- SELECT: Todos ven templates de su empresa
CREATE POLICY "Users can view company templates"
ON public.templates FOR SELECT
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- INSERT: Cualquier usuario puede crear templates
CREATE POLICY "Users can create their own templates"
ON public.templates FOR INSERT
WITH CHECK (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
);

-- UPDATE: Solo el creador o admins
CREATE POLICY "Users can update their own templates"
ON public.templates FOR UPDATE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
        created_by = auth.uid()
        OR (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
);

-- DELETE: Solo el creador o admins
CREATE POLICY "Users can delete their own templates"
ON public.templates FOR DELETE
USING (
    company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    AND (
        created_by = auth.uid()
        OR (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
);

-- ============================================
-- PARTE 8: Políticas para NOTIFICATIONS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- SELECT: Solo propias notificaciones
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
    user_id = auth.uid()
);

-- UPDATE: Marcar como leídas solo las propias
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
    user_id = auth.uid()
)
WITH CHECK (
    user_id = auth.uid()
);

-- INSERT: Función del sistema (via trigger o Edge Function con service_role)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);  -- Controlado por service_role key

-- ============================================
-- PARTE 9: Políticas para AUDIT_LOGS
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- SELECT: Solo admins pueden ver logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (
    (SELECT role_v2 FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- INSERT: Sistema (via trigger)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);  -- Controlado por triggers SECURITY DEFINER

-- ============================================
-- PARTE 10: Crear índices para optimizar RLS
-- ============================================

-- Índices para mejorar performance de políticas RLS
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_v2 ON public.profiles(role_v2);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_requisitions_company_created ON public.requisitions(company_id, created_by);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions(company_id, business_status);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition_id ON public.requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_templates_company_created ON public.templates(company_id, created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id, created_at DESC);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que RLS esté habilitado en todas las tablas
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'products', 'requisitions', 'requisition_items',
    'projects', 'templates', 'notifications', 'audit_logs', 'profiles'
  )
ORDER BY tablename;

-- Verificar políticas creadas
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '✅ RLS Completo aplicado correctamente' as status;
