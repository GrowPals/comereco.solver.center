# 🗄️ IMPLEMENTACIÓN BACKEND SUPABASE - COMERECO
## Script SQL Completo para Estructura de Base de Datos

Este documento contiene el script SQL completo para crear toda la estructura del backend en Supabase, incluyendo tablas, políticas RLS, funciones RPC, triggers e índices.

---

## 📋 ÍNDICE

1. [Extensiones Requeridas](#extensiones-requeridas)
2. [Tipos ENUM](#tipos-enum)
3. [Tablas Principales](#tablas-principales)
4. [Tablas de Relación](#tablas-de-relación)
5. [Políticas RLS](#políticas-rls)
6. [Funciones RPC](#funciones-rpc)
7. [Triggers](#triggers)
8. [Índices](#índices)
9. [Datos Iniciales](#datos-iniciales)

---

## 🔧 EXTENSIONES REQUERIDAS

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas con ilike
```

---

## 📝 TIPOS ENUM

```sql
-- Tipo de roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'user');

-- Estados de requisición
CREATE TYPE requisition_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent_to_erp',
  'cancelled'
);

-- Tipos de notificación
CREATE TYPE notification_type AS ENUM ('success', 'warning', 'danger', 'info');
```

---

## 🏢 TABLAS PRINCIPALES

### 1. companies (Compañías)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  bind_location_id TEXT,
  bind_price_list_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_active ON companies(active);
```

### 2. users (Usuarios - Tabla profiles)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  phone TEXT,
  last_sign_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. projects (Proyectos)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT supervisor_must_be_supervisor CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = supervisor_id AND role = 'supervisor'
    )
  )
);

CREATE INDEX idx_projects_supervisor ON projects(supervisor_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_active ON projects(active);
CREATE INDEX idx_projects_created_by ON projects(created_by);
```

### 4. project_members (Relación Usuarios-Proyectos)

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requires_approval BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(project_id, user_id),
  CONSTRAINT user_cannot_be_supervisor CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_id AND role = 'supervisor'
    )
  )
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_requires_approval ON project_members(requires_approval);
```

### 5. products (Productos)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'pza',
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, sku)
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku_trgm ON products USING gin(sku gin_trgm_ops);
```

### 6. requisitions (Requisiciones)

```sql
CREATE TABLE requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  created_by UUID NOT NULL REFERENCES profiles(id),
  status requisition_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_folio TEXT,
  comments TEXT,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT approver_must_be_supervisor_or_admin CHECK (
    approved_by IS NULL OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = approved_by AND role IN ('supervisor', 'admin')
    )
  )
);

CREATE INDEX idx_requisitions_project ON requisitions(project_id);
CREATE INDEX idx_requisitions_created_by ON requisitions(created_by);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_approved_by ON requisitions(approved_by);
CREATE INDEX idx_requisitions_company ON requisitions(company_id);
CREATE INDEX idx_requisitions_internal_folio ON requisitions(internal_folio);
CREATE INDEX idx_requisitions_created_at ON requisitions(created_at DESC);
```

### 7. requisition_templates (Plantillas)

```sql
CREATE TABLE requisition_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_project ON requisition_templates(project_id);
CREATE INDEX idx_templates_created_by ON requisition_templates(created_by);
CREATE INDEX idx_templates_company ON requisition_templates(company_id);
CREATE INDEX idx_templates_favorite ON requisition_templates(is_favorite);
```

### 8. user_cart_items (Carrito de Usuario)

```sql
CREATE TABLE user_cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_user ON user_cart_items(user_id);
CREATE INDEX idx_cart_product ON user_cart_items(product_id);
```

### 9. notifications (Notificaciones)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### 10. favorites (Favoritos)

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
```

---

## 🔗 TABLAS DE RELACIÓN Y AUXILIARES

### audit_log (Log de Auditoría)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  user_id UUID REFERENCES profiles(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_record ON audit_log(record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

---

## 🔐 POLÍTICAS RLS (Row Level Security)

### Habilitar RLS en todas las tablas

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
```

### Helper Function: Verificar si usuario es admin

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Helper Function: Verificar si usuario es supervisor

```sql
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'supervisor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Helper Function: Obtener company_id del usuario

```sql
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### POLÍTICAS RLS POR TABLA

#### profiles

```sql
-- ADMIN: Puede ver todos los perfiles
CREATE POLICY "admin_select_all_profiles" ON profiles
FOR SELECT USING (is_admin());

-- ADMIN: Puede modificar todos los perfiles
CREATE POLICY "admin_modify_all_profiles" ON profiles
FOR ALL USING (is_admin());

-- SUPERVISOR: Puede ver usuarios de sus proyectos
CREATE POLICY "supervisor_select_project_users" ON profiles
FOR SELECT USING (
  is_supervisor() AND (
    id IN (
      SELECT pm.user_id FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.supervisor_id = auth.uid()
    )
    OR id = auth.uid()
  )
);

-- USUARIO: Solo puede ver su propio perfil
CREATE POLICY "user_select_own_profile" ON profiles
FOR SELECT USING (id = auth.uid());

-- USUARIO: Solo puede actualizar su propio perfil
CREATE POLICY "user_update_own_profile" ON profiles
FOR UPDATE USING (id = auth.uid());
```

#### companies

```sql
-- ADMIN: Puede ver todas las compañías
CREATE POLICY "admin_select_all_companies" ON companies
FOR SELECT USING (is_admin());

-- USUARIO/SUPERVISOR: Solo puede ver su propia compañía
CREATE POLICY "user_select_own_company" ON companies
FOR SELECT USING (id = get_user_company_id());
```

#### projects

```sql
-- ADMIN: Puede ver todos los proyectos
CREATE POLICY "admin_select_all_projects" ON projects
FOR SELECT USING (is_admin());

-- ADMIN: Puede modificar todos los proyectos
CREATE POLICY "admin_modify_all_projects" ON projects
FOR ALL USING (is_admin());

-- SUPERVISOR: Solo puede ver SUS proyectos
CREATE POLICY "supervisor_select_own_projects" ON projects
FOR SELECT USING (
  supervisor_id = auth.uid() AND is_supervisor()
);

-- SUPERVISOR: Solo puede modificar SUS proyectos
CREATE POLICY "supervisor_modify_own_projects" ON projects
FOR ALL USING (
  supervisor_id = auth.uid() AND is_supervisor()
);

-- USUARIO: Solo puede ver proyectos donde es miembro
CREATE POLICY "user_select_member_projects" ON projects
FOR SELECT USING (
  id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);
```

#### project_members

```sql
-- ADMIN: Puede gestionar todos los miembros
CREATE POLICY "admin_manage_all_members" ON project_members
FOR ALL USING (is_admin());

-- SUPERVISOR: Puede gestionar miembros de SUS proyectos
CREATE POLICY "supervisor_manage_own_members" ON project_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  ) AND is_supervisor()
);

-- USUARIO: Solo puede ver su propia membresía
CREATE POLICY "user_select_own_membership" ON project_members
FOR SELECT USING (user_id = auth.uid());
```

#### products

```sql
-- ADMIN: Puede ver todos los productos
CREATE POLICY "admin_select_all_products" ON products
FOR SELECT USING (is_admin());

-- ADMIN: Puede modificar todos los productos
CREATE POLICY "admin_modify_all_products" ON products
FOR ALL USING (is_admin());

-- USUARIO/SUPERVISOR: Solo puede ver productos de su compañía
CREATE POLICY "user_select_company_products" ON products
FOR SELECT USING (company_id = get_user_company_id());
```

#### requisitions

```sql
-- ADMIN: Puede ver todas las requisiciones
CREATE POLICY "admin_select_all_requisitions" ON requisitions
FOR SELECT USING (is_admin());

-- ADMIN: Puede modificar todas las requisiciones
CREATE POLICY "admin_modify_all_requisitions" ON requisitions
FOR ALL USING (is_admin());

-- SUPERVISOR: Solo ve requisiciones de SUS proyectos
CREATE POLICY "supervisor_select_own_project_requisitions" ON requisitions
FOR SELECT USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  ) AND is_supervisor()
);

-- SUPERVISOR: Solo puede aprobar/rechazar en SUS proyectos
CREATE POLICY "supervisor_approve_own_projects" ON requisitions
FOR UPDATE USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  ) AND is_supervisor()
  AND status = 'pending_approval'
);

-- USUARIO: Solo ve SUS requisiciones
CREATE POLICY "user_select_own_requisitions" ON requisitions
FOR SELECT USING (created_by = auth.uid());

-- USUARIO: Solo puede crear requisiciones en proyectos donde es miembro
CREATE POLICY "user_insert_own_project_requisitions" ON requisitions
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- USUARIO: Solo puede editar sus borradores
CREATE POLICY "user_update_own_draft" ON requisitions
FOR UPDATE USING (
  created_by = auth.uid()
  AND status = 'draft'
);
```

#### requisition_templates

```sql
-- ADMIN: Puede gestionar todas las plantillas
CREATE POLICY "admin_manage_all_templates" ON requisition_templates
FOR ALL USING (is_admin());

-- SUPERVISOR: Puede gestionar plantillas de SUS proyectos
CREATE POLICY "supervisor_manage_own_templates" ON requisition_templates
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  ) AND is_supervisor()
);

-- USUARIO: Solo puede ver plantillas de proyectos donde es miembro
CREATE POLICY "user_select_member_templates" ON requisition_templates
FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);
```

#### user_cart_items

```sql
-- Usuario solo puede gestionar su propio carrito
CREATE POLICY "user_manage_own_cart" ON user_cart_items
FOR ALL USING (user_id = auth.uid());
```

#### notifications

```sql
-- Usuario solo puede ver sus propias notificaciones
CREATE POLICY "user_select_own_notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- Usuario solo puede actualizar sus propias notificaciones
CREATE POLICY "user_update_own_notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());
```

#### favorites

```sql
-- Usuario solo puede gestionar sus propios favoritos
CREATE POLICY "user_manage_own_favorites" ON favorites
FOR ALL USING (user_id = auth.uid());
```

---

## ⚙️ FUNCIONES RPC

### 1. submit_requisition - Enviar Requisición

```sql
CREATE OR REPLACE FUNCTION submit_requisition(p_requisition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition requisitions%ROWTYPE;
  v_requires_approval BOOLEAN;
  v_final_status requisition_status;
BEGIN
  -- Obtener la requisición
  SELECT * INTO v_requisition
  FROM requisitions
  WHERE id = p_requisition_id
  AND created_by = auth.uid()
  AND status = 'draft';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requisición no encontrada o no puede ser enviada';
  END IF;
  
  -- Verificar si el usuario requiere aprobación
  SELECT requires_approval INTO v_requires_approval
  FROM project_members
  WHERE project_id = v_requisition.project_id
  AND user_id = auth.uid();
  
  -- Determinar estado final
  IF v_requires_approval THEN
    v_final_status := 'pending_approval';
  ELSE
    v_final_status := 'approved';
  END IF;
  
  -- Actualizar estado
  UPDATE requisitions
  SET status = v_final_status,
      updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Si fue aprobada automáticamente, enviar a ERP
  IF v_final_status = 'approved' THEN
    UPDATE requisitions
    SET status = 'sent_to_erp',
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_requisition_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'requisition_id', p_requisition_id,
    'status', v_final_status
  );
END;
$$;
```

### 2. approve_requisition - Aprobar Requisición

```sql
CREATE OR REPLACE FUNCTION approve_requisition(
  p_requisition_id UUID,
  p_comments TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition requisitions%ROWTYPE;
BEGIN
  -- Verificar permisos: supervisor del proyecto o admin
  SELECT * INTO v_requisition
  FROM requisitions r
  JOIN projects p ON r.project_id = p.id
  WHERE r.id = p_requisition_id
  AND r.status = 'pending_approval'
  AND (
    p.supervisor_id = auth.uid() AND is_supervisor()
    OR is_admin()
  );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para aprobar esta requisición';
  END IF;
  
  -- Aprobar
  UPDATE requisitions
  SET status = 'approved',
      approved_by = auth.uid(),
      approved_at = NOW(),
      comments = COALESCE(p_comments, comments),
      updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Enviar a ERP
  UPDATE requisitions
  SET status = 'sent_to_erp',
      updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Crear notificación para el usuario
  INSERT INTO notifications (user_id, type, title, message, link, company_id)
  VALUES (
    v_requisition.created_by,
    'success',
    'Requisición Aprobada',
    'Tu requisición ' || COALESCE(v_requisition.internal_folio, v_requisition.id::text) || ' ha sido aprobada.',
    '/requisitions/' || p_requisition_id,
    v_requisition.company_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'requisition_id', p_requisition_id
  );
END;
$$;
```

### 3. reject_requisition - Rechazar Requisición

```sql
CREATE OR REPLACE FUNCTION reject_requisition(
  p_requisition_id UUID,
  p_rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition requisitions%ROWTYPE;
BEGIN
  -- Verificar permisos: supervisor del proyecto o admin
  SELECT * INTO v_requisition
  FROM requisitions r
  JOIN projects p ON r.project_id = p.id
  WHERE r.id = p_requisition_id
  AND r.status = 'pending_approval'
  AND (
    p.supervisor_id = auth.uid() AND is_supervisor()
    OR is_admin()
  );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar esta requisición';
  END IF;
  
  IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
    RAISE EXCEPTION 'Debes proporcionar una razón de rechazo';
  END IF;
  
  -- Rechazar
  UPDATE requisitions
  SET status = 'rejected',
      rejected_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE id = p_requisition_id;
  
  -- Crear notificación para el usuario
  INSERT INTO notifications (user_id, type, title, message, link, company_id)
  VALUES (
    v_requisition.created_by,
    'danger',
    'Requisición Rechazada',
    'Tu requisición ' || COALESCE(v_requisition.internal_folio, v_requisition.id::text) || ' ha sido rechazada: ' || p_rejection_reason,
    '/requisitions/' || p_requisition_id,
    v_requisition.company_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'requisition_id', p_requisition_id
  );
END;
$$;
```

### 4. create_full_requisition - Crear Requisición Completa (Atómica)

```sql
CREATE OR REPLACE FUNCTION create_full_requisition(
  p_project_id UUID,
  p_items JSONB,
  p_comments TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition_id UUID;
  v_company_id UUID;
  v_internal_folio TEXT;
BEGIN
  -- Verificar que el usuario es miembro del proyecto
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No eres miembro de este proyecto';
  END IF;
  
  -- Obtener company_id
  SELECT company_id INTO v_company_id FROM projects WHERE id = p_project_id;
  
  -- Generar folio interno
  v_internal_folio := 'REQ-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
    lpad((SELECT COUNT(*)::text FROM requisitions WHERE DATE(created_at) = CURRENT_DATE), 4, '0');
  
  -- Crear requisición
  INSERT INTO requisitions (
    project_id,
    created_by,
    status,
    items,
    comments,
    internal_folio,
    company_id
  ) VALUES (
    p_project_id,
    auth.uid(),
    'draft',
    p_items,
    p_comments,
    v_internal_folio,
    v_company_id
  ) RETURNING id INTO v_requisition_id;
  
  RETURN v_requisition_id;
END;
$$;
```

### 5. use_requisition_template - Usar Plantilla

```sql
CREATE OR REPLACE FUNCTION use_requisition_template(p_template_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template requisition_templates%ROWTYPE;
  v_requisition_id UUID;
BEGIN
  -- Obtener plantilla
  SELECT * INTO v_template
  FROM requisition_templates
  WHERE id = p_template_id
  AND project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plantilla no encontrada o no tienes acceso';
  END IF;
  
  -- Crear requisición desde plantilla
  v_requisition_id := create_full_requisition(
    v_template.project_id,
    v_template.items,
    'Creada desde plantilla: ' || v_template.name
  );
  
  -- Actualizar contadores de plantilla
  UPDATE requisition_templates
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_template_id;
  
  RETURN v_requisition_id;
END;
$$;
```

### 6. clear_user_cart - Limpiar Carrito

```sql
CREATE OR REPLACE FUNCTION clear_user_cart()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_cart_items WHERE user_id = auth.uid();
  
  RETURN jsonb_build_object('success', true);
END;
$$;
```

### 7. broadcast_to_company - Broadcast a Compañía

```sql
CREATE OR REPLACE FUNCTION broadcast_to_company(
  p_event_name TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Obtener company_id del usuario
  SELECT company_id INTO v_company_id FROM profiles WHERE id = auth.uid();
  
  -- Esta función se usa para eventos real-time
  -- En un caso real, aquí se publicaría un evento a un canal de Supabase Realtime
  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'event_name', p_event_name,
    'payload', p_payload
  );
END;
$$;
```

### 8. get_unique_product_categories - Obtener Categorías Únicas

```sql
CREATE OR REPLACE FUNCTION get_unique_product_categories(p_company_id UUID)
RETURNS TABLE(category TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT category
  FROM products
  WHERE company_id = p_company_id
  AND is_active = true
  AND category IS NOT NULL
  ORDER BY category;
END;
$$;
```

---

## 🔄 TRIGGERS

### Trigger: Actualizar updated_at automáticamente

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requisitions_updated_at BEFORE UPDATE ON requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON requisition_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON user_cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Trigger: Crear perfil automáticamente al registrarse

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'),
    (NEW.raw_user_meta_data->>'company_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Trigger: Generar folio interno automáticamente

```sql
CREATE OR REPLACE FUNCTION generate_requisition_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.internal_folio IS NULL THEN
    NEW.internal_folio := 'REQ-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
      lpad((SELECT COUNT(*)::text FROM requisitions WHERE DATE(created_at) = CURRENT_DATE), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_requisition_insert
  BEFORE INSERT ON requisitions
  FOR EACH ROW EXECUTE FUNCTION generate_requisition_folio();
```

---

## 📊 ÍNDICES ADICIONALES PARA PERFORMANCE

```sql
-- Índices compuestos para queries frecuentes
CREATE INDEX idx_project_members_project_user ON project_members(project_id, user_id);
CREATE INDEX idx_requisitions_project_status ON requisitions(project_id, status);
CREATE INDEX idx_requisitions_created_by_status ON requisitions(created_by, status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_products_company_active ON products(company_id, is_active);
```

---

## 📝 DATOS INICIALES (OPCIONAL)

```sql
-- Insertar compañía de ejemplo
INSERT INTO companies (id, name, slug, description, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Grupo Solven',
  'grupo-solven',
  'Compañía principal',
  true
) ON CONFLICT DO NOTHING;

-- Insertar usuario admin inicial (ajustar según necesidad)
-- Esto debe hacerse después de crear el usuario en auth.users
-- INSERT INTO profiles (id, email, full_name, role, company_id)
-- VALUES (
--   'UUID_DEL_ADMIN',
--   'admin@comereco.com',
--   'Administrador',
--   'admin',
--   '00000000-0000-0000-0000-000000000001'
-- );
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Ejecutar extensiones
- [ ] Crear tipos ENUM
- [ ] Crear todas las tablas
- [ ] Crear índices
- [ ] Habilitar RLS en todas las tablas
- [ ] Crear funciones helper (is_admin, is_supervisor, get_user_company_id)
- [ ] Crear todas las políticas RLS
- [ ] Crear todas las funciones RPC
- [ ] Crear triggers
- [ ] Verificar permisos de funciones SECURITY DEFINER
- [ ] Insertar datos iniciales si es necesario
- [ ] Probar políticas RLS con diferentes roles
- [ ] Probar funciones RPC

---

## 🔒 NOTAS DE SEGURIDAD

1. **SECURITY DEFINER**: Todas las funciones RPC usan SECURITY DEFINER para ejecutarse con permisos elevados, pero validan auth.uid() internamente.

2. **Validación de permisos**: Todas las funciones verifican permisos antes de ejecutar operaciones.

3. **RLS siempre activo**: Todas las tablas tienen RLS habilitado y políticas explícitas.

4. **Constraints**: Se usan constraints CHECK para validar datos a nivel de base de datos.

5. **Auditoría**: La tabla audit_log permite rastrear cambios (requiere trigger adicional si se desea).

---

## 📚 PRÓXIMOS PASOS

1. Ejecutar este script completo en Supabase SQL Editor
2. Verificar que todas las políticas funcionan correctamente
3. Probar funciones RPC con diferentes roles
4. Configurar triggers de auditoría si se requiere
5. Configurar integración con Bind ERP para envío automático

