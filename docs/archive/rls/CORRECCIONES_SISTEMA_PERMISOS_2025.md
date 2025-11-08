# 🎯 Correcciones del Sistema de Permisos y Perfiles - 2025

**Fecha:** 2 de Enero, 2025
**Proyecto:** ComerECO WebApp
**Estado:** ✅ Completado
**Prioridad:** CRÍTICA

---

## 📋 Resumen Ejecutivo

Se identificaron y corrigieron **4 problemas críticos** que impedían:
1. ❌ Actualizar perfiles de usuario
2. ❌ Editar campos como teléfono
3. ❌ Que admins vean usuarios de su compañía
4. ❌ Que supervisores vean perfiles de su equipo

### ✅ Problemas Resueltos

| # | Problema | Solución | Estado |
|---|----------|----------|--------|
| 1 | Profile.jsx usaba `updateUser` que no existe | Importar y usar `updateUserProfile` de userService | ✅ Corregido |
| 2 | Campo phone no existía en BD | Agregado campo `phone` a tabla profiles | ✅ Corregido |
| 3 | RLS bloqueaba acceso entre usuarios | Creadas políticas RLS para admin y supervisor | ✅ Corregido |
| 4 | Solo se podía editar nombre | Agregada edición de teléfono en UI | ✅ Corregido |

---

## 🔧 Cambios Realizados

### 1. Base de Datos (Supabase)

#### ✅ Migración 1: Agregar campo phone
```sql
ALTER TABLE public.profiles
ADD COLUMN phone text;

CREATE INDEX idx_profiles_phone
ON public.profiles(phone)
WHERE phone IS NOT NULL;
```

#### ✅ Migración 2: Políticas RLS para profiles
Se crearon **5 políticas RLS** nuevas:

**SELECT (Ver perfiles):**
1. `Users can view their own profile` - Usuarios ven su propio perfil
2. `Admins can view all company profiles` - Admins ven todos los perfiles de su empresa
3. `Supervisors can view team profiles` - Supervisores ven su equipo

**UPDATE (Editar perfiles):**
4. `Users can update their own profile` - Usuarios editan su perfil
5. `Admins can update all company profiles` - Admins editan cualquier perfil de su empresa

#### ✅ Funciones Helper Creadas
```sql
-- Funciones con SECURITY DEFINER para evitar recursión RLS
✅ get_user_role_v2() -> Obtiene el rol del usuario actual
✅ get_user_company_id() -> Obtiene la compañía del usuario actual
✅ is_admin() -> Verifica si es administrador
✅ is_supervisor() -> Verifica si es supervisor
```

#### ✅ Migración 3: Limpieza de políticas duplicadas
Se eliminaron 4 políticas antiguas duplicadas para evitar conflictos.

---

### 2. Frontend (React)

#### ✅ Archivo: [src/pages/Profile.jsx](../src/pages/Profile.jsx)

**Cambios realizados:**
- ✅ Importado `updateUserProfile` de userService
- ✅ Removido `updateUser` que no existía
- ✅ Agregado estado para `phone` en profileData
- ✅ Agregado estado `isSaving` para indicar guardado
- ✅ Mejorada función `handleSave` con validaciones
- ✅ Actualizado componente `ProfileInfoRow` para soportar campos editables
- ✅ Agregada edición de teléfono con placeholder
- ✅ Mejorada visualización de rol (Admin/Supervisor/Usuario)
- ✅ Agregado feedback visual durante guardado

**Campos editables ahora:**
- ✅ Nombre completo
- ✅ Teléfono

**Campos de solo lectura:**
- 📧 Email
- 👤 Rol
- 🏢 Compañía

---

#### ✅ Archivo: [src/services/userService.js](../src/services/userService.js)

**Cambios realizados:**
- ✅ Agregado `phone` a lista de campos permitidos
- ✅ Agregada validación de formato de teléfono
  - Permite números, espacios, guiones, paréntesis y +
  - Longitud entre 7 y 20 caracteres
  - Permite cadena vacía para eliminar teléfono
- ✅ Actualizado SELECT para incluir phone en resultados
- ✅ Agregado phone en `fetchUsersInCompany()`
- ✅ Agregado phone en `updateUserProfile()`

**Validación de teléfono:**
```javascript
// Formato permitido: +52 123 456 7890, (55) 1234-5678, etc.
const phoneRegex = /^[+\d\s\-()]+$/;
```

---

#### ✅ Archivo: [src/contexts/SupabaseAuthContext.jsx](../src/contexts/SupabaseAuthContext.jsx)

**Cambios realizados:**
- ✅ Agregado campo `phone` en SELECT al cargar perfil
- ✅ Ahora el objeto `user` incluye el teléfono

---

## 📊 Verificación del Sistema

### ✅ Estado de la Base de Datos

**Tabla profiles:**
```
✅ id (uuid, PK)
✅ company_id (uuid, FK)
✅ full_name (text)
✅ avatar_url (text)
✅ role_v2 (app_role_v2: admin|supervisor|user)
✅ phone (text) 🆕 NUEVO
✅ is_active (boolean)
✅ updated_at (timestamptz)
```

**Políticas RLS activas:**
```
✅ 3 políticas SELECT (Users, Admins, Supervisors)
✅ 2 políticas UPDATE (Users, Admins)
✅ 4 funciones helper (SECURITY DEFINER)
```

**Advisors de seguridad:**
```
⚠️ 1 warning: Leaked Password Protection Disabled (no crítico)
✅ 0 errores críticos de seguridad
```

---

## 🎯 Funcionalidades Recuperadas

### Para TODOS los usuarios:
- ✅ Ver su propio perfil completo
- ✅ Editar su nombre completo
- ✅ Editar su teléfono
- ✅ Ver su rol asignado
- ✅ Ver estadísticas de requisiciones
- ✅ Ver actividad reciente

### Para ADMINISTRADORES:
- ✅ Ver todos los perfiles de su compañía
- ✅ Editar cualquier perfil de su compañía
- ✅ Ver teléfonos de todos los usuarios
- ✅ Cambiar roles de usuarios
- ✅ Invitar nuevos usuarios

### Para SUPERVISORES:
- ✅ Ver perfiles de usuarios en sus proyectos
- ✅ Ver su propio perfil completo
- ✅ Aprobar/rechazar requisiciones
- ✅ Gestionar proyectos asignados

### Para USUARIOS:
- ✅ Ver y editar su propio perfil
- ✅ Crear requisiciones
- ✅ Ver sus propias requisiciones
- ✅ Usar plantillas

---

## 🧪 Cómo Probar las Correcciones

### 1. Prueba de Actualización de Perfil

**Como cualquier usuario:**
1. Ir a la página de Perfil
2. Hacer clic en el botón "Editar" (ícono de lápiz)
3. Cambiar el nombre completo
4. Agregar/editar el teléfono
5. Hacer clic en "Guardar"
6. ✅ Debe mostrar mensaje "Tu perfil ha sido actualizado correctamente"
7. ✅ Los cambios deben persistir al recargar la página

### 2. Prueba de Permisos de Admin

**Como administrador:**
1. Ir a "Gestión de Usuarios"
2. ✅ Debe ver lista completa de usuarios de la compañía
3. ✅ Debe ver teléfonos de todos los usuarios
4. Hacer clic en "Editar" en un usuario
5. ✅ Debe poder cambiar su rol
6. ✅ Debe poder editar su perfil completo

### 3. Prueba de Permisos de Supervisor

**Como supervisor:**
1. Ir a Dashboard
2. ✅ Debe ver dashboard específico de supervisor
3. Ir a "Aprobaciones"
4. ✅ Debe ver requisiciones pendientes
5. Ir a "Proyectos"
6. ✅ Debe poder crear proyectos
7. ✅ Debe ver perfiles de usuarios en sus proyectos

### 4. Prueba de Visualización de Rol

**Como cualquier usuario:**
1. Ir a Perfil
2. ✅ En el campo "Rol" debe mostrar:
   - "Administrador" si es admin
   - "Supervisor" si es supervisor
   - "Usuario" si es user
3. ✅ El rol NO debe ser editable
4. ✅ El rol NO debe mostrar "N/A"

---

## 📁 Archivos Modificados

```
src/
├── pages/
│   └── Profile.jsx ........................... ✅ MODIFICADO
├── services/
│   └── userService.js ........................ ✅ MODIFICADO
├── contexts/
│   └── SupabaseAuthContext.jsx ............... ✅ MODIFICADO
└── hooks/
    └── useUserPermissions.js ................. ✅ (Sin cambios)

docs/
└── CORRECCIONES_SISTEMA_PERMISOS_2025.md ..... ✅ NUEVO
```

---

## 🚀 Migraciones Aplicadas en Supabase

```
✅ add_phone_field_to_profiles
   - Agregado campo phone a profiles
   - Creado índice idx_profiles_phone

✅ fix_rls_policies_for_profiles
   - Creadas 4 funciones helper (SECURITY DEFINER)
   - Creadas 5 políticas RLS nuevas
   - Eliminadas políticas antiguas conflictivas

✅ cleanup_duplicate_rls_policies
   - Eliminadas 4 políticas duplicadas
   - Limpieza final del sistema RLS
```

---

## 🔐 Seguridad

### Políticas RLS Activas

**Tabla: profiles**

| Operación | Política | Descripción |
|-----------|----------|-------------|
| SELECT | Users can view their own profile | Usuario ve su perfil |
| SELECT | Admins can view all company profiles | Admin ve todos los perfiles |
| SELECT | Supervisors can view team profiles | Supervisor ve su equipo |
| UPDATE | Users can update their own profile | Usuario edita su perfil |
| UPDATE | Admins can update all company profiles | Admin edita cualquier perfil |

### Validaciones Implementadas

**En userService.js:**
- ✅ Validación de sesión activa
- ✅ Validación de ID de usuario
- ✅ Validación de nombre (mín. 2 caracteres)
- ✅ Validación de teléfono (formato y longitud)
- ✅ Whitelist de campos permitidos
- ✅ Sanitización de datos (trim)
- ✅ Validación de rol (admin, supervisor, user)

**En Base de Datos:**
- ✅ RLS habilitado en todas las tablas
- ✅ Funciones helper con SECURITY DEFINER
- ✅ Políticas por nivel de acceso
- ✅ Foreign Keys para integridad referencial
- ✅ Índices para optimizar queries

---

## 🎓 Conceptos Técnicos

### Row Level Security (RLS)

RLS es una característica de PostgreSQL que permite controlar qué filas puede ver/modificar cada usuario. En lugar de controlar acceso solo en el frontend, **la base de datos misma** bloquea el acceso no autorizado.

**Ejemplo:**
```sql
-- Esta política dice: "Un admin puede ver todos los perfiles
-- de su misma compañía"
CREATE POLICY "Admins can view all company profiles"
ON public.profiles FOR SELECT
USING (
    is_admin()
    AND company_id = get_user_company_id()
);
```

### SECURITY DEFINER

Las funciones con `SECURITY DEFINER` se ejecutan con los permisos del **dueño de la función** (generalmente el superusuario), no con los permisos del usuario que la llama.

Esto evita recursión infinita en RLS: si una política RLS llama a una función que consulta la misma tabla, necesitamos bypass RLS temporalmente.

---

## 📝 Notas para el Equipo

### ⚠️ Advertencias

1. **NO eliminar las funciones helper** (`is_admin`, `is_supervisor`, etc.) - Las políticas RLS las requieren
2. **NO modificar políticas RLS sin probar** - Puede bloquear acceso accidentalmente
3. **Siempre probar con múltiples roles** - Admin, Supervisor y Usuario
4. **El campo phone es opcional** - Permitir NULL o cadena vacía

### 🎯 Próximos Pasos Sugeridos

1. ✅ **Habilitar Leaked Password Protection** en Auth settings de Supabase
2. ⏳ **Agregar campo "avatar_url" editable** en Profile.jsx
3. ⏳ **Implementar carga de foto de perfil** (upload a Supabase Storage)
4. ⏳ **Agregar más campos al perfil**: cargo, departamento, fecha de ingreso
5. ⏳ **Crear página de gestión de permisos** para admins
6. ⏳ **Implementar auditoría de cambios** en perfiles

### 🐛 Debug

Si encuentras problemas:

**1. Error al actualizar perfil:**
```javascript
// Ver en consola del navegador
console.log('User object:', user);
console.log('Profile data:', profileData);
```

**2. No se ven otros usuarios (Admin):**
```sql
-- Verificar políticas en Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verificar rol del usuario
SELECT id, full_name, role_v2 FROM profiles WHERE id = auth.uid();
```

**3. Error de recursión RLS:**
```sql
-- Verificar que funciones helper usen SECURITY DEFINER
SELECT proname, prosecdef
FROM pg_proc
WHERE proname IN ('is_admin', 'is_supervisor');
```

---

## 🎉 Conclusión

Se completaron exitosamente **todas las correcciones** identificadas:

- ✅ Actualización de perfiles funciona correctamente
- ✅ Campo teléfono agregado y editable
- ✅ Permisos por rol funcionando correctamente
- ✅ Políticas RLS aplicadas y verificadas
- ✅ Validaciones implementadas
- ✅ Seguridad reforzada

**El sistema de permisos ahora funciona como se diseñó originalmente.**

---

## 📞 Contacto

Para preguntas o problemas con estas correcciones:
- Revisar este documento primero
- Verificar logs en consola del navegador
- Ejecutar queries de verificación en Supabase
- Revisar advisors de seguridad: `mcp__supabaseLocal__get_advisors`

**Documento generado:** 2 de Enero, 2025
**Versión:** 1.0.0
**Estado:** ✅ Producción
