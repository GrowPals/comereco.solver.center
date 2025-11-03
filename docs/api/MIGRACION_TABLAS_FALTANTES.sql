-- ============================================
-- MIGRACIÓN: Tablas Faltantes
-- Fecha: 2025-01-02
-- Descripción: Crea tablas necesarias para funcionalidades del frontend
-- Prioridad: ALTA
-- ============================================

-- ============================================
-- PARTE 1: Tabla TEMPLATES (Plantillas de Requisiciones)
-- ============================================

CREATE TABLE IF NOT EXISTS public.templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Información de la plantilla
    name text NOT NULL,
    description text,

    -- Items de la plantilla (JSON array de productos)
    -- [{ product_id: uuid, quantity: number, notes: text }]
    items jsonb NOT NULL DEFAULT '[]'::jsonb,

    -- Metadata
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Constraints
    CONSTRAINT templates_name_not_empty CHECK (char_length(name) > 0),
    CONSTRAINT templates_items_is_array CHECK (jsonb_typeof(items) = 'array')
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_templates_company_id ON public.templates(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON public.templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.templates IS 'Plantillas de requisiciones para reutilizar combinaciones comunes de productos';
COMMENT ON COLUMN public.templates.items IS 'Array JSON de items: [{ product_id, quantity, notes }]';

-- ============================================
-- PARTE 2: Tabla NOTIFICATIONS (Notificaciones)
-- ============================================

-- Crear enum para tipos de notificación
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'requisition_created',
        'requisition_approved',
        'requisition_rejected',
        'requisition_sent_to_bind',
        'user_invited',
        'role_changed',
        'system_announcement'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Tipo y contenido
    type notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,

    -- Datos adicionales (enlaces, IDs relacionados, etc.)
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Estado
    is_read boolean DEFAULT false,
    read_at timestamptz,

    -- Timestamps
    created_at timestamptz DEFAULT now(),

    -- Constraints
    CONSTRAINT notifications_title_not_empty CHECK (char_length(title) > 0),
    CONSTRAINT notifications_message_not_empty CHECK (char_length(message) > 0)
);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = now()
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentarios
COMMENT ON TABLE public.notifications IS 'Notificaciones para usuarios del sistema';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales como { requisition_id, link, etc }';

-- ============================================
-- PARTE 3: Tabla AUDIT_LOGS (Logs de Auditoría)
-- ============================================

-- Crear enum para acciones de auditoría
DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'create',
        'update',
        'delete',
        'approve',
        'reject',
        'send_to_bind',
        'login',
        'logout',
        'invite_user',
        'change_role'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Acción realizada
    action audit_action NOT NULL,
    table_name text,
    record_id uuid,

    -- Detalles
    description text NOT NULL,
    old_values jsonb,
    new_values jsonb,

    -- Metadata adicional (IP, user agent, etc.)
    metadata jsonb DEFAULT '{}'::jsonb,

    -- Timestamp
    created_at timestamptz DEFAULT now(),

    -- Constraints
    CONSTRAINT audit_logs_description_not_empty CHECK (char_length(description) > 0)
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Función helper para crear logs de auditoría
CREATE OR REPLACE FUNCTION public.log_audit_action(
    p_action audit_action,
    p_table_name text,
    p_record_id uuid,
    p_description text,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_company_id uuid;
BEGIN
    -- Obtener company_id del usuario actual
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = auth.uid();

    -- Insertar log
    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        action,
        table_name,
        record_id,
        description,
        old_values,
        new_values
    ) VALUES (
        v_company_id,
        auth.uid(),
        p_action,
        p_table_name,
        p_record_id,
        p_description,
        p_old_values,
        p_new_values
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentarios
COMMENT ON TABLE public.audit_logs IS 'Registro de auditoría de acciones importantes en el sistema';
COMMENT ON FUNCTION public.log_audit_action IS 'Helper para crear logs de auditoría fácilmente';

-- ============================================
-- PARTE 4: Tabla USER_FAVORITES (Productos Favoritos)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

    -- Timestamps
    created_at timestamptz DEFAULT now(),

    -- Constraint de unicidad
    UNIQUE(user_id, product_id)
);

-- Índices para user_favorites
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product_id ON public.user_favorites(product_id);

-- Habilitar RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add favorites" ON public.user_favorites;
CREATE POLICY "Users can add favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can remove favorites" ON public.user_favorites;
CREATE POLICY "Users can remove favorites"
ON public.user_favorites FOR DELETE
USING (user_id = auth.uid());

-- Función para toggle favorite
CREATE OR REPLACE FUNCTION public.toggle_favorite(p_product_id uuid)
RETURNS boolean AS $$
DECLARE
    v_exists boolean;
BEGIN
    -- Verificar si ya existe
    SELECT EXISTS(
        SELECT 1 FROM public.user_favorites
        WHERE user_id = auth.uid() AND product_id = p_product_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Remover de favoritos
        DELETE FROM public.user_favorites
        WHERE user_id = auth.uid() AND product_id = p_product_id;
        RETURN false;
    ELSE
        -- Agregar a favoritos
        INSERT INTO public.user_favorites (user_id, product_id)
        VALUES (auth.uid(), p_product_id);
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comentarios
COMMENT ON TABLE public.user_favorites IS 'Productos marcados como favoritos por usuario';
COMMENT ON FUNCTION public.toggle_favorite IS 'Agrega o remueve producto de favoritos, retorna true si fue agregado';

-- ============================================
-- PARTE 5: Triggers para Notificaciones Automáticas
-- ============================================

-- Función para crear notificación cuando se crea requisición
CREATE OR REPLACE FUNCTION public.notify_requisition_created()
RETURNS TRIGGER AS $$
DECLARE
    v_creator_name text;
BEGIN
    -- Obtener nombre del creador
    SELECT full_name INTO v_creator_name
    FROM public.profiles
    WHERE id = NEW.created_by;

    -- Notificar a supervisores y admins de la empresa
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    SELECT
        p.id,
        'requisition_created'::notification_type,
        'Nueva Requisición Creada',
        v_creator_name || ' ha creado la requisición ' || NEW.internal_folio,
        jsonb_build_object(
            'requisition_id', NEW.id,
            'folio', NEW.internal_folio,
            'link', '/requisitions/' || NEW.id
        )
    FROM public.profiles p
    WHERE p.company_id = NEW.company_id
      AND p.role_v2 IN ('admin', 'supervisor')
      AND p.id != NEW.created_by;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificar cuando se crea requisición
DROP TRIGGER IF EXISTS notify_on_requisition_created ON public.requisitions;
CREATE TRIGGER notify_on_requisition_created
    AFTER INSERT ON public.requisitions
    FOR EACH ROW
    WHEN (NEW.business_status != 'draft')
    EXECUTE FUNCTION public.notify_requisition_created();

-- Función para notificar cuando se aprueba/rechaza requisición
CREATE OR REPLACE FUNCTION public.notify_requisition_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_approver_name text;
BEGIN
    -- Solo notificar si cambió de pending a approved/rejected
    IF OLD.business_status = 'pending' AND NEW.business_status IN ('approved', 'rejected') THEN
        -- Obtener nombre del aprobador
        SELECT full_name INTO v_approver_name
        FROM public.profiles
        WHERE id = NEW.approved_by;

        -- Notificar al creador
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.created_by,
            ('requisition_' || NEW.business_status)::notification_type,
            CASE
                WHEN NEW.business_status = 'approved' THEN 'Requisición Aprobada'
                ELSE 'Requisición Rechazada'
            END,
            'Tu requisición ' || NEW.internal_folio || ' ha sido ' ||
            CASE
                WHEN NEW.business_status = 'approved' THEN 'aprobada'
                ELSE 'rechazada'
            END || ' por ' || COALESCE(v_approver_name, 'un supervisor'),
            jsonb_build_object(
                'requisition_id', NEW.id,
                'folio', NEW.internal_folio,
                'status', NEW.business_status,
                'link', '/requisitions/' || NEW.id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para notificar cambios de estado
DROP TRIGGER IF EXISTS notify_on_requisition_status_change ON public.requisitions;
CREATE TRIGGER notify_on_requisition_status_change
    AFTER UPDATE ON public.requisitions
    FOR EACH ROW
    WHEN (OLD.business_status IS DISTINCT FROM NEW.business_status)
    EXECUTE FUNCTION public.notify_requisition_status_change();

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que las tablas existan
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('templates', 'notifications', 'audit_logs', 'user_favorites')
ORDER BY table_name;

-- Verificar triggers
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'notify_%'
ORDER BY trigger_name;

SELECT '✅ Tablas faltantes creadas correctamente' as status;
