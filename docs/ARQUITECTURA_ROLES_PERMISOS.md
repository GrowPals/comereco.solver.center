# 🎭 ARQUITECTURA DE ROLES Y PERMISOS - COMERECO

## Sistema de Requisiciones con 3 Roles: ADMIN, SUPERVISOR, USUARIO

---

## 📋 RESUMEN EJECUTIVO

Sistema de requisiciones de compra con tres roles jerárquicos:

- **ADMIN**: Control total del sistema
- **SUPERVISOR**: Control de sus proyectos asignados
- **USUARIO**: Creación y gestión de sus propias requisiciones

---

## 🎭 LOS TRES ROLES DEL SISTEMA

### 1️⃣ ADMIN (Control Total)

**Visión**: Control absoluto de toda la plataforma.

**Capacidades**:

- ✅ Ve TODO: todos los proyectos, supervisores, usuarios, requisiciones
- ✅ Modifica TODO: puede editar, cancelar, eliminar cualquier entidad
- ✅ Gestiona usuarios: crear, editar, eliminar, cambiar roles de cualquier usuario
- ✅ Gestiona proyectos: crear, editar, eliminar proyectos de cualquier supervisor
- ✅ Override de aprobaciones: puede aprobar/rechazar cualquier requisición sin restricciones
- ✅ Acceso a reportes globales: dashboards con métricas de toda la operación
- ✅ Configuración del sistema: ajustar parámetros, integraciones, plantillas maestras

**Interfaz**:

- Dashboard global con vista de todos los supervisores y sus proyectos
- Puede "entrar" a la vista de cualquier supervisor para ver su interfaz
- Panel de administración de usuarios y permisos
- Reportes y analytics consolidados

---

### 2️⃣ SUPERVISOR / SOLVER (Rey de su Reino)

**Visión**: Control total de sus propios proyectos, ciego a los demás.

**Capacidades**:

- ✅ Ve SUS proyectos: solo los proyectos que le han sido asignados
- ✅ Gestiona SUS usuarios: agregar/quitar usuarios a sus proyectos específicos
- ✅ Configura aprobaciones: decidir qué usuarios requieren su aprobación antes de enviar requisiciones
- ✅ Aprueba/rechaza: revisar y aprobar requisiciones de sus usuarios (si lo configuró así)
- ✅ Crea plantillas: para que sus usuarios usen en sus requisiciones
- ✅ Ve historiales: de todas las requisiciones de su proyecto
- ✅ Reportes de proyecto: métricas y datos solo de su(s) proyecto(s)
- ❌ NO ve otros proyectos: no puede ver ni interactuar con proyectos de otros supervisores

**Interfaz**:

- Dashboard de sus proyectos con métricas específicas
- Lista de usuarios de sus proyectos
- Bandeja de requisiciones pendientes de aprobación
- Gestión de plantillas para su equipo
- Historial de requisiciones de su proyecto

---

### 3️⃣ USUARIO (Comprador Enfocado)

**Visión**: Solo puede trabajar en su propia "tienda" para hacer compras.

**Capacidades**:

- ✅ Crear requisiciones: desde cero o usando plantillas
- ✅ Ver catálogo de productos: todos los productos disponibles para comprar
- ✅ Usar plantillas: las que su supervisor ha creado para él
- ✅ Ver SU historial: solo sus propias requisiciones
- ✅ Editar borradores: requisiciones que aún no ha enviado
- ✅ Duplicar requisiciones: reutilizar requisiciones anteriores
- ❌ NO ve otros usuarios: no sabe qué están comprando otros
- ❌ NO gestiona nada: no puede crear plantillas, ni usuarios, ni configurar nada

**Flujo condicional**:

**Si requiere aprobación** (configurado por supervisor):

```
1. Crea requisición → Estado: "Borrador"
2. Envía requisición → Estado: "Pendiente de aprobación"
3. Supervisor aprueba → Estado: "Aprobada" → Se envía a Bind ERP
```

**Si NO requiere aprobación**:

```
1. Crea requisición → Estado: "Borrador"
2. Envía requisición → Estado: "Aprobada" (automático) → Se envía a Bind ERP
```

**Interfaz**:

- Vista simple y limpia tipo "tienda de compras"
- Catálogo de productos con búsqueda y filtros
- Carrito de requisición
- Historial de mis compras
- Plantillas disponibles para usar

---

## 🗄️ ESQUEMA DE BASE DE DATOS SUPABASE

### Tablas Principales

#### 1. `users` (Usuarios)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'user')),
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
```

#### 2. `projects` (Proyectos)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID NOT NULL REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_supervisor ON projects(supervisor_id);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_active ON projects(active);
```

#### 3. `project_members` (Relación Usuarios-Proyectos)

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requires_approval BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES users(id),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
```

#### 4. `requisitions` (Requisiciones)

```sql
CREATE TABLE requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  created_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent_to_erp', 'cancelled')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_folio TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_requisitions_project ON requisitions(project_id);
CREATE INDEX idx_requisitions_created_by ON requisitions(created_by);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_approved_by ON requisitions(approved_by);
```

#### 5. `requisition_templates` (Plantillas)

```sql
CREATE TABLE requisition_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_templates_project ON requisition_templates(project_id);
CREATE INDEX idx_templates_created_by ON requisition_templates(created_by);
```

---

## 🔐 POLÍTICAS RLS (Row Level Security)

### TABLA: `users`

#### ADMIN - Puede ver y modificar TODOS los usuarios

```sql
-- Admin puede ver todos los usuarios
CREATE POLICY "admin_select_all_users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin puede modificar todos los usuarios
CREATE POLICY "admin_update_all_users" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin puede insertar usuarios
CREATE POLICY "admin_insert_users" ON users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### SUPERVISOR - Puede ver usuarios de sus proyectos

```sql
CREATE POLICY "supervisor_select_project_users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.supervisor_id = auth.uid()
    AND pm.user_id = users.id
  )
  OR id = auth.uid()
);
```

#### USUARIO - Solo puede ver su propio perfil

```sql
CREATE POLICY "user_select_own_profile" ON users
FOR SELECT USING (id = auth.uid());
```

---

### TABLA: `projects`

#### ADMIN - Puede ver y modificar TODOS los proyectos

```sql
CREATE POLICY "admin_select_all_projects" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "admin_modify_all_projects" ON projects
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### SUPERVISOR - Solo puede ver SUS proyectos

```sql
CREATE POLICY "supervisor_select_own_projects" ON projects
FOR SELECT USING (
  supervisor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "supervisor_update_own_projects" ON projects
FOR UPDATE USING (
  supervisor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### USUARIO - Solo puede ver proyectos donde es miembro

```sql
CREATE POLICY "user_select_member_projects" ON projects
FOR SELECT USING (
  id IN (
    SELECT project_id FROM project_members
    WHERE user_id = auth.uid()
  )
);
```

---

### TABLA: `project_members`

#### ADMIN - Puede gestionar TODOS los miembros

```sql
CREATE POLICY "admin_manage_all_members" ON project_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### SUPERVISOR - Puede gestionar miembros de SUS proyectos

```sql
CREATE POLICY "supervisor_manage_own_members" ON project_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### USUARIO - Solo puede ver si es miembro

```sql
CREATE POLICY "user_select_own_membership" ON project_members
FOR SELECT USING (user_id = auth.uid());
```

---

### TABLA: `requisitions`

#### ADMIN - Puede ver y modificar TODAS las requisiciones

```sql
CREATE POLICY "admin_select_all_requisitions" ON requisitions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "admin_modify_all_requisitions" ON requisitions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### SUPERVISOR - Solo ve requisiciones de SUS proyectos

```sql
CREATE POLICY "supervisor_select_own_project_requisitions" ON requisitions
FOR SELECT USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Supervisor solo puede aprobar/rechazar en SUS proyectos
CREATE POLICY "supervisor_approve_own_projects" ON requisitions
FOR UPDATE USING (
  (
    project_id IN (
      SELECT id FROM projects WHERE supervisor_id = auth.uid()
    )
    AND status = 'pending_approval'
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### USUARIO - Solo ve SUS propias requisiciones

```sql
CREATE POLICY "user_select_own_requisitions" ON requisitions
FOR SELECT USING (
  created_by = auth.uid()
);

-- Usuario solo puede crear requisiciones en proyectos donde es miembro
CREATE POLICY "user_insert_own_project_requisitions" ON requisitions
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

-- Usuario solo puede editar sus borradores
CREATE POLICY "user_update_own_draft" ON requisitions
FOR UPDATE USING (
  created_by = auth.uid()
  AND status = 'draft'
);

-- Usuario puede enviar requisición (cambiar estado a pending_approval o approved)
CREATE POLICY "user_submit_requisition" ON requisitions
FOR UPDATE USING (
  created_by = auth.uid()
  AND status = 'draft'
);
```

---

### TABLA: `requisition_templates`

#### ADMIN - Puede ver y modificar TODAS las plantillas

```sql
CREATE POLICY "admin_manage_all_templates" ON requisition_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### SUPERVISOR - Puede crear y ver plantillas de SUS proyectos

```sql
CREATE POLICY "supervisor_manage_own_templates" ON requisition_templates
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE supervisor_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

#### USUARIO - Solo puede ver plantillas de proyectos donde es miembro

```sql
CREATE POLICY "user_select_member_templates" ON requisition_templates
FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  )
);
```

---

## 🔄 FUNCIONES RPC PARA LÓGICA DE NEGOCIO

### Función: Enviar Requisición (con lógica de aprobación automática)

```sql
CREATE OR REPLACE FUNCTION submit_requisition(p_requisition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requisition requisitions%ROWTYPE;
  v_requires_approval BOOLEAN;
  v_final_status TEXT;
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
    -- Aquí iría la lógica para enviar a Bind ERP
    -- Por ahora solo actualizamos el estado
    UPDATE requisitions
    SET status = 'sent_to_erp'
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

### Función: Aprobar Requisición

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
    p.supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
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
  
  -- Enviar a ERP (aquí iría la integración con Bind ERP)
  UPDATE requisitions
  SET status = 'sent_to_erp'
  WHERE id = p_requisition_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'requisition_id', p_requisition_id
  );
END;
$$;
```

### Función: Rechazar Requisición

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
    p.supervisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tienes permisos para rechazar esta requisición';
  END IF;
  
  -- Rechazar
  UPDATE requisitions
  SET status = 'rejected',
      rejected_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE id = p_requisition_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'requisition_id', p_requisition_id
  );
END;
$$;
```

---

## 📱 IMPLEMENTACIÓN FRONTEND

### Helper: Verificar Rol

```javascript
// src/utils/roleHelpers.js
export const hasRole = (user, role) => {
  return user?.role === role;
};

export const isAdmin = (user) => hasRole(user, 'admin');
export const isSupervisor = (user) => hasRole(user, 'supervisor');
export const isUser = (user) => hasRole(user, 'user');

export const canViewAllProjects = (user) => isAdmin(user);
export const canManageUsers = (user) => isAdmin(user) || isSupervisor(user);
export const canApproveRequisitions = (user) => isAdmin(user) || isSupervisor(user);
```

### Hook: useUserPermissions

```javascript
// src/hooks/useUserPermissions.js
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useMemo } from 'react';

export const useUserPermissions = () => {
  const { user } = useSupabaseAuth();
  
  return useMemo(() => ({
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isUser: user?.role === 'user',
    canViewAllProjects: user?.role === 'admin',
    canManageUsers: user?.role === 'admin' || user?.role === 'supervisor',
    canApproveRequisitions: user?.role === 'admin' || user?.role === 'supervisor',
    canCreateProjects: user?.role === 'admin',
    canCreateTemplates: user?.role === 'admin' || user?.role === 'supervisor',
  }), [user]);
};
```

---

## ✨ CARACTERÍSTICAS ESPECIALES

### Delegación de Permisos

- **Admin puede "actuar como" cualquier supervisor** para debugging
- **Supervisor puede "previsualizar" la vista de un usuario específico**

### Notificaciones

- **Usuario** → recibe notificación cuando su requisición es aprobada/rechazada
- **Supervisor** → recibe notificación cuando tiene requisiciones pendientes
- **Admin** → recibe resumen diario/semanal de actividad

### Auditoría

- Cada acción crítica queda registrada (quién aprobó, cuándo, por qué se rechazó)
- Admin puede ver historial completo de cambios

---

## 🎯 PROMPT RESUMIDO PARA HORIZON AI

```
Implementa un sistema de roles y permisos en Supabase para ComerECO con 3 roles:

1. ADMIN: Acceso total. Puede ver/modificar todo (usuarios, proyectos, requisiciones).
2. SUPERVISOR: Solo ve SUS proyectos. Puede gestionar usuarios de sus proyectos, aprobar requisiciones, crear plantillas.
3. USUARIO: Solo ve sus requisiciones. Puede crear requisiciones en proyectos donde es miembro.

Tablas: users (role), projects (supervisor_id), project_members (requires_approval), requisitions (status).

Lógica clave:
- Usuario envía requisición → Si requires_approval=true → status='pending_approval', si no → status='approved'
- Supervisor puede aprobar/rechazar solo requisiciones de SUS proyectos
- Admin puede hacer TODO sin restricciones

Necesito:
1. Esquema completo de tablas con índices
2. Políticas RLS para cada rol y tabla
3. Funciones RPC para submit_requisition, approve_requisition, reject_requisition
4. Helpers frontend para verificar permisos
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear tablas: users, projects, project_members, requisitions, requisition_templates
- [ ] Implementar políticas RLS para ADMIN en todas las tablas
- [ ] Implementar políticas RLS para SUPERVISOR en todas las tablas
- [ ] Implementar políticas RLS para USUARIO en todas las tablas
- [ ] Crear función RPC submit_requisition con lógica de aprobación automática
- [ ] Crear función RPC approve_requisition
- [ ] Crear función RPC reject_requisition
- [ ] Crear helpers frontend para verificar permisos
- [ ] Crear hook useUserPermissions
- [ ] Implementar notificaciones por rol
- [ ] Implementar sistema de auditoría
