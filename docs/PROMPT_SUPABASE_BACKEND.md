# 🎯 PROMPT PARA IA DE SUPABASE - IMPLEMENTACIÓN BACKEND COMPLETA

## OBJETIVO

Crear la estructura completa del backend en Supabase para ComerECO, incluyendo todas las tablas, políticas RLS, funciones RPC, triggers e índices necesarios para un sistema de requisiciones con 3 roles: ADMIN, SUPERVISOR, USUARIO.

---

## CONTEXTO DEL SISTEMA

- **3 Roles**: admin (control total), supervisor (solo sus proyectos), user (solo sus requisiciones)
- **Aprobación condicional**: Usuarios pueden requerir aprobación del supervisor antes de enviar a ERP
- **Multi-tenant**: Cada compañía tiene sus propios datos (products, requisitions, users)
- **Seguridad**: RLS activo en todas las tablas con políticas específicas por rol

---

## ESTRUCTURA DE TABLAS REQUERIDAS

### Tablas Principales

1. **companies** - Compañías (multi-tenant)
2. **profiles** - Usuarios (referencia auth.users)
3. **projects** - Proyectos (supervisor_id)
4. **project_members** - Relación usuarios-proyectos (requires_approval)
5. **products** - Productos del catálogo
6. **requisitions** - Requisiciones de compra
7. **requisition_templates** - Plantillas de requisiciones
8. **user_cart_items** - Carrito de usuario
9. **notifications** - Notificaciones del sistema
10. **favorites** - Productos favoritos
11. **audit_log** - Log de auditoría (opcional)

---

## COMPONENTES REQUERIDOS

### 1. Extensiones
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 2. Tipos ENUM
```sql
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'user');
CREATE TYPE requisition_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'sent_to_erp', 'cancelled');
CREATE TYPE notification_type AS ENUM ('success', 'warning', 'danger', 'info');
```

### 3. Funciones Helper
- `is_admin()` - Verificar si usuario es admin
- `is_supervisor()` - Verificar si usuario es supervisor
- `get_user_company_id()` - Obtener company_id del usuario autenticado
- `update_updated_at_column()` - Trigger function para updated_at

### 4. Funciones RPC
- `submit_requisition(requisition_id)` - Enviar requisición (lógica de aprobación automática)
- `approve_requisition(requisition_id, comments)` - Aprobar requisición
- `reject_requisition(requisition_id, reason)` - Rechazar requisición
- `create_full_requisition(project_id, items, comments)` - Crear requisición completa (atómica)
- `use_requisition_template(template_id)` - Usar plantilla para crear requisición
- `clear_user_cart()` - Limpiar carrito del usuario
- `broadcast_to_company(event_name, payload)` - Broadcast para real-time
- `get_unique_product_categories(company_id)` - Obtener categorías de productos

### 5. Triggers
- Auto-crear perfil cuando se registra usuario en auth.users
- Auto-generar folio interno de requisición
- Auto-actualizar updated_at en todas las tablas

### 6. Políticas RLS
- ADMIN: Acceso total a todo
- SUPERVISOR: Solo sus proyectos y usuarios de sus proyectos
- USUARIO: Solo sus propios datos y proyectos donde es miembro

---

## REQUISITOS ESPECÍFICOS

### Seguridad
- ✅ RLS habilitado en TODAS las tablas
- ✅ Políticas explícitas para cada rol y operación
- ✅ Funciones RPC con SECURITY DEFINER pero validan auth.uid()
- ✅ Constraints CHECK para validar datos

### Performance
- ✅ Índices en todas las foreign keys
- ✅ Índices en campos de búsqueda frecuente (status, role, company_id)
- ✅ Índices GIN para búsqueda de texto (products.name, products.sku)

### Integridad
- ✅ Foreign keys con ON DELETE CASCADE donde corresponde
- ✅ Constraints UNIQUE donde necesario
- ✅ Constraints CHECK para validar estados y roles

### Funcionalidad
- ✅ Generación automática de folio interno (REQ-YYYYMMDD-####)
- ✅ Lógica de aprobación automática basada en requires_approval
- ✅ Notificaciones automáticas al aprobar/rechazar
- ✅ Actualización automática de contadores de plantillas

---

## CASOS DE USO CRÍTICOS

### Caso 1: Usuario envía requisición
```
1. Usuario crea requisición → status='draft'
2. Llama submit_requisition(id)
3. Sistema verifica requires_approval en project_members
4. Si true → status='pending_approval'
5. Si false → status='approved' → 'sent_to_erp'
```

### Caso 2: Supervisor aprueba requisición
```
1. Supervisor llama approve_requisition(id, comments)
2. Sistema verifica que es supervisor del proyecto o admin
3. Actualiza status='approved' → 'sent_to_erp'
4. Crea notificación para el usuario
```

### Caso 3: Admin ve todo
```
1. Admin hace SELECT en cualquier tabla
2. Política RLS permite ver TODO porque is_admin() = true
```

### Caso 4: Supervisor solo ve sus proyectos
```
1. Supervisor hace SELECT en projects
2. Política RLS filtra: supervisor_id = auth.uid()
3. No ve proyectos de otros supervisores
```

---

## ESTRUCTURA ESPECÍFICA DE TABLAS

### profiles (Tabla principal de usuarios)
```sql
- id UUID (PK, FK a auth.users)
- email TEXT UNIQUE
- full_name TEXT
- role user_role (admin, supervisor, user)
- company_id UUID (FK a companies)
- avatar_url TEXT
- metadata JSONB
```

### requisitions (Tabla principal de requisiciones)
```sql
- id UUID (PK)
- project_id UUID (FK a projects)
- created_by UUID (FK a profiles)
- status requisition_status
- approved_by UUID (FK a profiles, NULLABLE)
- items JSONB (array de productos)
- internal_folio TEXT (generado automáticamente)
- company_id UUID (FK a companies)
```

### project_members (Clave para aprobación condicional)
```sql
- project_id UUID (FK a projects)
- user_id UUID (FK a profiles)
- requires_approval BOOLEAN ← CLAVE: determina flujo
- UNIQUE(project_id, user_id)
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
✅ Triggers funcionan correctamente (perfil, folio, updated_at)

---

## ENTREGABLES ESPERADOS

1. ✅ Script SQL completo listo para ejecutar en Supabase SQL Editor
2. ✅ Todas las tablas creadas con índices y constraints
3. ✅ RLS habilitado y políticas implementadas
4. ✅ Funciones helper creadas
5. ✅ Funciones RPC creadas con lógica de negocio
6. ✅ Triggers configurados
7. ✅ Documentación de uso de cada función RPC

---

## INSTRUCCIONES ESPECÍFICAS

1. **Ejecutar en orden**: Extensiones → ENUMs → Tablas → Índices → Funciones → RLS → Triggers
2. **Validar permisos**: Todas las funciones RPC deben usar SECURITY DEFINER pero validar auth.uid()
3. **Probar políticas**: Después de crear, probar con diferentes roles
4. **Optimizar índices**: Crear índices compuestos para queries frecuentes
5. **Documentar funciones**: Cada función RPC debe tener comentarios explicando su uso

---

## NOTAS IMPORTANTES

- **SECURITY DEFINER**: Todas las funciones RPC usan SECURITY DEFINER para ejecutarse con permisos elevados, pero validan auth.uid() internamente
- **Validación de permisos**: Todas las funciones verifican permisos antes de ejecutar operaciones
- **RLS siempre activo**: Todas las tablas tienen RLS habilitado y políticas explícitas
- **Constraints**: Se usan constraints CHECK para validar datos a nivel de base de datos
- **Auditoría**: Tabla audit_log permite rastrear cambios (opcional, requiere trigger adicional)

---

## SCRIPT SQL COMPLETO ESPERADO

El script debe incluir:

1. Extensiones requeridas
2. Tipos ENUM
3. Todas las tablas con sus campos, tipos y constraints
4. Índices (simples y compuestos)
5. Funciones helper (is_admin, is_supervisor, get_user_company_id)
6. Funciones RPC completas con lógica de negocio
7. Políticas RLS para cada tabla y operación
8. Triggers (perfil automático, folio automático, updated_at)
9. Comentarios explicativos en cada componente

---

## RESULTADO ESPERADO

Al finalizar, debo tener:
- ✅ Base de datos completamente estructurada
- ✅ Seguridad implementada con RLS
- ✅ Funciones RPC funcionando correctamente
- ✅ Triggers automáticos funcionando
- ✅ Sistema listo para producción con 3 roles funcionales

