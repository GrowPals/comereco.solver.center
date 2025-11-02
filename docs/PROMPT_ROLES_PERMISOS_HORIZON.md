# 🎯 PROMPT PARA HORIZON AI - IMPLEMENTACIÓN ROLES Y PERMISOS

## OBJETIVO

Implementar sistema de roles y permisos completo en Supabase para ComerECO con 3 roles jerárquicos: ADMIN, SUPERVISOR, USUARIO.

---

## ARQUITECTURA DE ROLES

### ADMIN (Control Total)
- Ve y modifica TODO: usuarios, proyectos, requisiciones
- Puede crear/editar/eliminar cualquier entidad
- Override de aprobaciones

### SUPERVISOR (Control de sus Proyectos)
- Solo ve SUS proyectos asignados
- Gestiona usuarios de sus proyectos
- Configura si usuarios requieren aprobación (requires_approval)
- Aprueba/rechaza requisiciones de SUS proyectos
- Crea plantillas para sus proyectos
- ❌ NO ve proyectos de otros supervisores

### USUARIO (Solo sus Requisiciones)
- Crea requisiciones en proyectos donde es miembro
- Ve solo SUS requisiciones
- Usa plantillas de sus proyectos
- Flujo condicional:
  - Si requires_approval=true → envía → status='pending_approval' → espera aprobación
  - Si requires_approval=false → envía → status='approved' → se envía a ERP automáticamente

---

## ESQUEMA DE TABLAS REQUERIDAS

### 1. users
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- role (TEXT: 'admin', 'supervisor', 'user')
- company_id (UUID, FK)
- avatar_url (TEXT)
- created_at, updated_at
- metadata (JSONB)
```

### 2. projects
```sql
- id (UUID, PK)
- name (TEXT)
- description (TEXT)
- supervisor_id (UUID, FK → users.id)
- created_by (UUID, FK → users.id)
- company_id (UUID, FK)
- active (BOOLEAN)
- created_at, updated_at
```

### 3. project_members
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- user_id (UUID, FK → users.id)
- requires_approval (BOOLEAN) ← CLAVE: determina si usuario necesita aprobación
- added_at (TIMESTAMP)
- added_by (UUID, FK → users.id)
- UNIQUE(project_id, user_id)
```

### 4. requisitions
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- created_by (UUID, FK → users.id)
- status (TEXT: 'draft', 'pending_approval', 'approved', 'rejected', 'sent_to_erp', 'cancelled')
- approved_by (UUID, FK → users.id, NULLABLE)
- approved_at (TIMESTAMP, NULLABLE)
- rejected_at (TIMESTAMP, NULLABLE)
- rejection_reason (TEXT, NULLABLE)
- items (JSONB)
- internal_folio (TEXT)
- comments (TEXT)
- created_at, updated_at
```

### 5. requisition_templates
```sql
- id (UUID, PK)
- project_id (UUID, FK → projects.id)
- created_by (UUID, FK → users.id)
- name (TEXT)
- description (TEXT)
- items (JSONB)
- is_favorite (BOOLEAN)
- usage_count (INTEGER)
- last_used_at (TIMESTAMP)
- created_at, updated_at
```

---

## POLÍTICAS RLS CRÍTICAS

### REGLA GENERAL: Admin siempre puede TODO

### users
- ADMIN: SELECT/UPDATE/INSERT/DELETE en todos
- SUPERVISOR: SELECT en usuarios de sus proyectos + su propio perfil
- USUARIO: SELECT solo su propio perfil

### projects
- ADMIN: SELECT/UPDATE/INSERT/DELETE en todos
- SUPERVISOR: SELECT/UPDATE solo SUS proyectos (supervisor_id = auth.uid())
- USUARIO: SELECT solo proyectos donde es miembro (project_members)

### project_members
- ADMIN: ALL en todos
- SUPERVISOR: ALL solo en proyectos donde es supervisor
- USUARIO: SELECT solo su propia membresía

### requisitions
- ADMIN: SELECT/UPDATE/INSERT/DELETE en todos
- SUPERVISOR: SELECT en requisiciones de SUS proyectos, UPDATE para aprobar/rechazar solo pending_approval
- USUARIO: SELECT solo SUS requisiciones (created_by = auth.uid()), INSERT en proyectos donde es miembro, UPDATE solo borradores propios

### requisition_templates
- ADMIN: ALL en todos
- SUPERVISOR: ALL en plantillas de SUS proyectos
- USUARIO: SELECT solo plantillas de proyectos donde es miembro

---

## FUNCIONES RPC REQUERIDAS

### 1. submit_requisition(p_requisition_id UUID)
**Lógica**:
1. Verificar que requisición existe, es del usuario y está en 'draft'
2. Buscar requires_approval del usuario en project_members
3. Si requires_approval = true → status = 'pending_approval'
4. Si requires_approval = false → status = 'approved' → luego 'sent_to_erp'
5. Retornar nuevo status

### 2. approve_requisition(p_requisition_id UUID, p_comments TEXT)
**Lógica**:
1. Verificar que usuario es supervisor del proyecto O admin
2. Verificar que requisición está en 'pending_approval'
3. Actualizar: status='approved', approved_by=auth.uid(), approved_at=NOW()
4. Cambiar a 'sent_to_erp' (simular envío a Bind ERP)
5. Retornar éxito

### 3. reject_requisition(p_requisition_id UUID, p_rejection_reason TEXT)
**Lógica**:
1. Verificar que usuario es supervisor del proyecto O admin
2. Verificar que requisición está en 'pending_approval'
3. Actualizar: status='rejected', rejected_at=NOW(), rejection_reason=p_rejection_reason
4. Retornar éxito

---

## IMPLEMENTACIÓN FRONTEND

### Helpers requeridos
```javascript
// Verificar roles
isAdmin(user)
isSupervisor(user)
isUser(user)

// Verificar permisos
canViewAllProjects(user)
canManageUsers(user)
canApproveRequisitions(user)
canCreateProjects(user)
canCreateTemplates(user)
```

### Hook useUserPermissions
```javascript
export const useUserPermissions = () => {
  const { user } = useSupabaseAuth();
  return {
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isUser: user?.role === 'user',
    canViewAllProjects: user?.role === 'admin',
    canManageUsers: user?.role === 'admin' || user?.role === 'supervisor',
    canApproveRequisitions: user?.role === 'admin' || user?.role === 'supervisor',
    canCreateProjects: user?.role === 'admin',
    canCreateTemplates: user?.role === 'admin' || user?.role === 'supervisor',
  };
};
```

---

## CASOS DE USO ESPECÍFICOS

### Caso 1: Usuario envía requisición con aprobación requerida
```
1. Usuario crea requisición → status='draft'
2. Usuario llama submit_requisition(requisition_id)
3. Sistema verifica requires_approval=true en project_members
4. Sistema actualiza status='pending_approval'
5. Supervisor recibe notificación
6. Supervisor aprueba → status='approved' → 'sent_to_erp'
```

### Caso 2: Usuario envía requisición SIN aprobación requerida
```
1. Usuario crea requisición → status='draft'
2. Usuario llama submit_requisition(requisition_id)
3. Sistema verifica requires_approval=false en project_members
4. Sistema actualiza status='approved' automáticamente
5. Sistema actualiza status='sent_to_erp' (simular envío)
```

### Caso 3: Supervisor ve requisiciones pendientes
```
1. Supervisor hace SELECT en requisitions
2. RLS filtra: solo requisiciones donde project_id IN (proyectos donde es supervisor)
3. Muestra solo requisiciones con status='pending_approval'
```

### Caso 4: Admin ve todo
```
1. Admin hace SELECT en cualquier tabla
2. RLS permite ver TODO porque es admin
3. Puede modificar cualquier cosa sin restricciones
```

---

## VALIDACIONES CRÍTICAS

✅ Admin siempre puede ver/modificar TODO
✅ Supervisor solo ve SUS proyectos (supervisor_id = auth.uid())
✅ Usuario solo ve SUS requisiciones (created_by = auth.uid())
✅ Usuario solo puede crear requisiciones en proyectos donde es miembro
✅ Supervisor solo puede aprobar requisiciones de SUS proyectos
✅ Función submit_requisition respeta requires_approval
✅ Todas las políticas RLS verifican role correctamente
✅ Índices creados en foreign keys y campos de búsqueda frecuente

---

## ENTREGABLES

1. ✅ Script SQL completo con todas las tablas, índices y políticas RLS
2. ✅ Funciones RPC: submit_requisition, approve_requisition, reject_requisition
3. ✅ Helpers frontend: roleHelpers.js con funciones de verificación
4. ✅ Hook: useUserPermissions.js
5. ✅ Documentación de casos de uso y flujos

---

## NOTAS IMPORTANTES

- **Seguridad**: Todas las políticas RLS deben verificar auth.uid() y role
- **Performance**: Crear índices en foreign keys y campos de búsqueda frecuente
- **Auditoría**: Campos approved_by, approved_at, rejected_at, rejection_reason deben poblarse correctamente
- **Integración**: Función submit_requisition debe simular envío a Bind ERP cuando status='approved' y requires_approval=false

