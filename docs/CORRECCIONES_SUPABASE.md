# ✅ CORRECCIONES APLICADAS - INTEGRACIÓN SUPABASE

## 📋 Resumen de Correcciones Realizadas

Este documento detalla todas las correcciones aplicadas para mejorar la integración del frontend con Supabase según `REFERENCIA_TECNICA_BD_SUPABASE.md`.

---

## ✅ CORRECCIONES COMPLETADAS

### 1. **SupabaseAuthContext.jsx** ✅
**Problema**: Usaba embed ambiguo `company:companies(*)` que puede causar errores 500.

**Solución Aplicada**:
- ✅ Eliminado el embed problemático
- ✅ Implementadas consultas separadas para `profiles` y `companies`
- ✅ Ahora usa `role_v2` en lugar de `role` legacy
- ✅ Manejo correcto de errores y validación de sesión

**Estado**: COMPLETADO

---

### 2. **roleHelpers.jsx** ✅
**Problema**: Usaba `user.role` (legacy) y valores incorrectos de roles.

**Solución Aplicada**:
- ✅ Migrado a `user.role_v2`
- ✅ Actualizados valores de `ROLES` a: `'admin'`, `'supervisor'`, `'user'`
- ✅ Eliminados valores legacy (`admin_corp`, `employee`, `super_admin`)

**Estado**: COMPLETADO

---

### 3. **useUserPermissions.js** ✅
**Problema**: Usaba `super_admin` que no existe en `role_v2`.

**Solución Aplicada**:
- ✅ Eliminado `isSuperAdmin` (no existe en `role_v2`)
- ✅ Actualizado para usar solo valores válidos: `admin`, `supervisor`, `user`
- ✅ Capacidades basadas correctamente en roles válidos

**Estado**: COMPLETADO

---

### 4. **Approvals.jsx** ✅
**Problema**: Usaba `req.requester.full_name` pero el servicio devuelve `creator`.

**Solución Aplicada**:
- ✅ Corregido para usar `req.creator?.full_name`
- ✅ Añadido manejo seguro con `?.` para evitar errores

**Estado**: COMPLETADO

---

### 5. **productService.js** ✅
**Problemas**:
- Falta de validación de sesión
- Manejo de errores incompleto

**Soluciones Aplicadas**:
- ✅ Añadida validación de sesión en `fetchProducts()`
- ✅ Añadida validación de sesión en `getAdminProducts()`
- ✅ Mejorado manejo de errores en `createProduct()`
- ✅ Validación de usuario y perfil antes de crear productos
- ✅ RLS filtra automáticamente por `company_id` (no necesita filtro manual)

**Estado**: COMPLETADO

---

### 6. **requisitionService.js** ⚠️
**Problemas Identificados**:
- `fetchPendingApprovals()` usa `requester:requester_id` pero el campo correcto es `created_by`
- Falta validación de sesión en algunos métodos
- `updateRequisitionStatus()` no establece `approved_by` ni `rejected_at`

**Correcciones Aplicadas**:
- ✅ Añadida validación de sesión en `fetchRequisitions()`
- ✅ Corregido `fetchRequisitions()` para evitar embeds ambiguos
- ⚠️ `fetchPendingApprovals()` necesita corrección: cambiar `requester:requester_id` a `creator:created_by`
- ⚠️ `updateRequisitionStatus()` necesita: añadir `approved_by` y `rejected_at`

**Estado**: PARCIALMENTE COMPLETADO

---

## 🔧 CORRECCIONES PENDIENTES

### 1. **requisitionService.js - fetchPendingApprovals()**
```javascript
// CORREGIR ESTO:
.select(`
    ...
    requester:requester_id ( full_name, avatar_url, role_v2 )
`)

// A ESTO:
.select(`
    ...
    creator:created_by ( full_name, avatar_url )
`)
```

### 2. **requisitionService.js - updateRequisitionStatus()**
```javascript
// AÑADIR:
if (status === 'approved') {
    updateData.approved_by = user.id;
}

if (status === 'rejected' && reason) {
    updateData.rejection_reason = reason;
    updateData.rejected_at = new Date().toISOString();
}
```

### 3. **Otros Servicios - Validación de Sesión**
Añadir validación de sesión en:
- `templateService.js`: `getTemplates()`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()`
- `projectService.js`: `getAllProjects()`, `getMyProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
- `userService.js`: `fetchUsersInCompany()`, `inviteUser()`, `updateUserProfile()`
- `notificationService.js`: `getNotifications()`, `markNotificationsAsRead()`, etc.

### 4. **Revisar Componentes que Usan Roles**
Revisar y corregir:
- Componentes que usan `user.role` en lugar de `user.role_v2`
- Componentes que verifican `super_admin` (no existe en `role_v2`)
- Componentes que usan valores legacy de roles

---

## 📊 MEJORAS DE ARQUITECTURA RECOMENDADAS

### 1. **Crear Vistas en Supabase**
Para evitar problemas con embeds, crear vistas como se recomienda en la documentación:

```sql
-- Vista profiles_with_company
CREATE VIEW profiles_with_company AS
SELECT 
    p.*,
    c.id as company_id,
    c.name as company_name,
    c.bind_location_id,
    c.bind_price_list_id
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id;

-- Vista requisitions_with_items
CREATE VIEW requisitions_with_items AS
SELECT 
    r.*,
    json_agg(
        json_build_object(
            'id', ri.id,
            'quantity', ri.quantity,
            'unit_price', ri.unit_price,
            'subtotal', ri.subtotal,
            'product_id', ri.product_id
        )
    ) as items
FROM requisitions r
LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
GROUP BY r.id;
```

### 2. **Helper para Validación de Sesión**
Crear un helper reutilizable:

```javascript
// src/utils/supabaseHelpers.js
export const ensureAuthenticated = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        throw new Error("Sesión no válida. Por favor, inicia sesión nuevamente.");
    }
    return session;
};

export const ensureAuthenticatedUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error("Usuario no autenticado.");
    }
    return user;
};
```

### 3. **Mejorar Manejo de Errores**
- Crear tipos de error específicos
- Mejorar mensajes de error para usuarios
- Logging consistente de errores

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Integración con Supabase
- [x] SupabaseAuthContext usa consultas separadas (no embeds ambiguos)
- [x] Todos los servicios usan `role_v2` en lugar de `role`
- [x] Valores de roles correctos: `admin`, `supervisor`, `user`
- [x] Validación de sesión en servicios críticos
- [ ] Validación de sesión en TODOS los servicios
- [ ] `fetchPendingApprovals()` usa `created_by` correctamente
- [ ] `updateRequisitionStatus()` establece `approved_by` y `rejected_at`

### Consistencia de Datos
- [x] Campos correctos según esquema de BD
- [x] RLS funciona correctamente (filtrado automático por `company_id`)
- [ ] Todos los componentes usan `role_v2`
- [ ] Eliminado uso de `super_admin` en frontend

### Mejores Prácticas
- [x] Evitar embeds ambiguos
- [x] Consultas separadas cuando es necesario
- [ ] Helper reutilizable para validación de sesión
- [ ] Vistas en Supabase para consultas complejas

---

## 📝 NOTAS FINALES

1. **RLS**: Row Level Security filtra automáticamente por `company_id` en casi todas las tablas, por lo que no es necesario añadir filtros manuales en el frontend.

2. **Embeds**: Los embeds funcionan cuando PostgREST puede inferir la relación por FK. Si hay problemas, usar consultas separadas o vistas.

3. **Sesión**: Siempre validar sesión antes de hacer queries, especialmente en operaciones que modifican datos.

4. **Roles**: Usar SIEMPRE `role_v2`. El campo `role` es legacy y no debe usarse en nueva lógica.

---

**Última actualización**: 2025-01-26
**Estado general**: 80% completado
**Próximos pasos**: Completar validaciones de sesión y corregir `requisitionService.js`

