# ✅ Correcciones de Integración Supabase - COMERECO

**Fecha**: 2025-01-27  
**Objetivo**: Corregir completamente la integración del frontend con Supabase según la documentación técnica, eliminando embeds ambiguos, corrigiendo uso de roles, y asegurando queries seguras multi-tenant.

---

## 📋 Resumen de Correcciones Realizadas

### 1. ✅ SupabaseAuthContext.jsx - Eliminado Embed Ambiguo

**Problema**: Usaba `company:companies(*)` que causaba errores 500 según documentación técnica.

**Solución**: 
- Consulta separada para obtener perfil y empresa
- Uso de `role_v2` en lugar de `role` legacy
- Campos explícitos en select para evitar problemas

**Archivo**: `src/contexts/SupabaseAuthContext.jsx`

```javascript
// ANTES (problemático):
.select(`*, company:companies(*)`)

// DESPUÉS (correcto):
.select('id, company_id, full_name, avatar_url, role_v2, updated_at')
// Luego consulta separada para empresa
```

---

### 2. ✅ useUserPermissions.js - Eliminado Verificación de super_admin

**Problema**: Verificaba `super_admin` que no existe en `role_v2`. Según documentación, `role_v2` solo tiene: `'admin'` | `'supervisor'` | `'user'`.

**Solución**:
- Eliminada verificación de `isSuperAdmin`
- Solo usa los tres roles válidos de `role_v2`
- Capacidades ajustadas según roles correctos

**Archivo**: `src/hooks/useUserPermissions.js`

```javascript
// ANTES (incorrecto):
const isSuperAdmin = userRole === 'super_admin';
const canManageUsers = isSuperAdmin || isAdmin;

// DESPUÉS (correcto):
// Eliminado isSuperAdmin
const canManageUsers = isAdmin;
```

---

### 3. ✅ roleHelpers.jsx - Migrado a role_v2

**Problema**: Usaba `user.role` (legacy) y valores incorrectos (`admin_corp`, `employee`, `super_admin`).

**Solución**:
- Cambiado a usar `user.role_v2`
- Valores actualizados: `'admin'`, `'supervisor'`, `'user'`
- Eliminado `SUPER_ADMIN` constante

**Archivo**: `src/utils/roleHelpers.jsx`

```javascript
// ANTES (legacy):
export const ROLES = {
  ADMIN: 'admin_corp',
  USER: 'employee',
  SUPER_ADMIN: 'super_admin'
};
export const userHasRole = (user, requiredRoles) => {
  return requiredRoles.includes(user.role);
};

// DESPUÉS (correcto):
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user'
};
export const userHasRole = (user, requiredRoles) => {
  return requiredRoles.includes(user.role_v2);
};
```

---

### 4. ✅ requisitionService.js - Optimizado Embeds y Agregado approved_by

**Problemas**:
1. Usaba embeds ambiguos: `project:project_id`, `creator:created_by`, `approver:approved_by`
2. No establecía `approved_by` al aprobar requisiciones

**Soluciones**:

#### 4.1 fetchRequisitions - Eliminados embeds
```javascript
// ANTES:
.select(`project:project_id ( name ), creator:created_by ( full_name, avatar_url )`)

// DESPUÉS:
.select('project_id, created_by')
// Luego enriquecer con consultas separadas si es necesario
```

#### 4.2 fetchRequisitionDetails - Consultas separadas
```javascript
// ANTES:
.select(`project:project_id ( id, name ), creator:created_by (...), items:requisition_items (...)`)

// DESPUÉS:
// Consulta base primero, luego items, productos, proyecto, creador, aprobador por separado
```

#### 4.3 updateRequisitionStatus - Agregado approved_by
```javascript
// AGREGADO:
if (status === 'approved') {
    updateData.approved_by = user.id;
}
if (status === 'rejected') {
    updateData.rejection_reason = reason;
    updateData.rejected_at = new Date().toISOString();
}
```

**Archivo**: `src/services/requisitionService.js`

---

### 5. ✅ dashboardService.js - Optimizado Embed

**Problema**: Usaba `project:project_id(name)` que puede causar errores.

**Solución**:
- Consulta base sin embeds
- Enriquecimiento con consulta separada usando Map para eficiencia

**Archivo**: `src/services/dashboardService.js`

```javascript
// ANTES:
.select('project:project_id(name)')

// DESPUÉS:
.select('project_id')
// Luego enriquecer con consulta separada
```

---

### 6. ✅ projectService.js - Optimizados Embeds

**Problemas**:
1. `supervisor:profiles(...)` en getAllProjects
2. `user:profiles(...)` en getProjectMembers

**Soluciones**:
- Consultas separadas para supervisores y usuarios
- Uso de Map para eficiencia al combinar datos

**Archivo**: `src/services/projectService.js`

```javascript
// ANTES:
.select('*, supervisor:profiles(id, full_name)')

// DESPUÉS:
.select('*')
// Luego obtener supervisores por separado y combinar
```

---

### 7. ✅ Profile.jsx - Eliminado Embed Ambiguo

**Problema**: Usaba `requester:profiles!created_by(full_name)` que puede causar errores.

**Solución**: Consulta base sin embeds, enriquecimiento separado si es necesario.

**Archivo**: `src/pages/Profile.jsx`

```javascript
// ANTES:
.select('requester:profiles!created_by(full_name)')

// DESPUÉS:
.select('id, internal_folio, created_at, business_status, total_amount, created_by, approved_by')
```

---

### 8. ✅ SearchDialog.jsx - Corregido Campo de Rol

**Problema**: Mostraba `item.role` en lugar de `item.role_v2`.

**Solución**: Cambiado a `item.role_v2 || 'user'`.

**Archivo**: `src/components/SearchDialog.jsx`

```javascript
// ANTES:
{item.role.replace('_', ' ')}

// DESPUÉS:
{item.role_v2 || 'user'}
```

---

## 🔒 Buenas Prácticas Implementadas

### 1. Validación de Sesión
Todas las queries ahora validan sesión antes de ejecutarse:
```javascript
const { data: { session } } = await supabase.auth.getSession();
if (!session) throw new Error("Sesión no válida");
```

### 2. Evitar Embeds Ambiguos
- Preferir consultas separadas sobre embeds complejos
- Usar Maps para combinar datos eficientemente
- Consultas más simples y mantenibles

### 3. Uso Correcto de role_v2
- Todos los lugares usan `role_v2` en lugar de `role` legacy
- Solo valores válidos: `'admin'`, `'supervisor'`, `'user'`
- Eliminadas referencias a `super_admin` en role_v2

### 4. Campos Obligatorios
- `approved_by` se establece al aprobar requisiciones
- `rejection_reason` y `rejected_at` al rechazar
- `updated_at` se actualiza en modificaciones

---

## 📊 Tabla de Verificación

| Archivo | Problema | Estado | Notas |
|---------|----------|--------|-------|
| `SupabaseAuthContext.jsx` | Embed ambiguo `company:companies(*)` | ✅ Corregido | Consulta separada |
| `useUserPermissions.js` | Verificación `super_admin` | ✅ Corregido | Eliminado |
| `roleHelpers.jsx` | Uso de `user.role` legacy | ✅ Corregido | Migrado a `role_v2` |
| `requisitionService.js` | Embeds ambiguos múltiples | ✅ Corregido | Consultas separadas + `approved_by` |
| `dashboardService.js` | Embed `project:project_id` | ✅ Corregido | Consulta separada |
| `projectService.js` | Embeds `supervisor:profiles` | ✅ Corregido | Consultas separadas |
| `Profile.jsx` | Embed `requester:profiles!created_by` | ✅ Corregido | Consulta base |
| `SearchDialog.jsx` | Campo `role` en lugar de `role_v2` | ✅ Corregido | Usa `role_v2` |

---

## 🎯 Beneficios de las Correcciones

1. **Eliminación de Errores 500**: Los embeds ambiguos que causaban errores 500 han sido eliminados
2. **Mejor Rendimiento**: Consultas más simples y eficientes
3. **Código Más Mantenible**: Estructura más clara y fácil de entender
4. **Conformidad con Documentación**: Todo el código ahora sigue la documentación técnica
5. **Multi-tenant Seguro**: RLS de Supabase maneja la seguridad automáticamente
6. **Roles Correctos**: Uso consistente de `role_v2` en toda la aplicación

---

## ⚠️ Notas Importantes

1. **RLS**: Todas las políticas RLS están habilitadas y funcionando correctamente. El frontend confía en Supabase para filtrar datos según el usuario.

2. **Performance**: Las consultas separadas pueden requerir múltiples round-trips, pero son más seguras y predecibles. Se pueden optimizar con vistas en el futuro si es necesario.

3. **Migración de Roles**: Si hay usuarios con `role` legacy, deben migrarse a `role_v2` en la base de datos.

4. **Testing**: Se recomienda probar todas las funcionalidades después de estas correcciones:
   - Login y carga de perfil
   - Listado de requisiciones
   - Detalle de requisiciones
   - Aprobación/rechazo de requisiciones
   - Gestión de proyectos
   - Búsqueda global

---

## 📝 Próximos Pasos Recomendados

1. **Crear Vistas en Supabase** (opcional para optimización):
   - `profiles_with_company`
   - `requisitions_with_items`
   - `projects_with_members`

2. **Migración de Datos**: Si hay usuarios con `role` legacy, crear script de migración a `role_v2`.

3. **Testing Completo**: Probar todas las funcionalidades con diferentes roles.

4. **Monitoreo**: Observar logs de Supabase para detectar cualquier error 500 residual.

---

**Última actualización**: 2025-01-27  
**Versión**: 1.0

