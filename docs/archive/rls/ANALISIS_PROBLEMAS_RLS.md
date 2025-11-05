# Análisis de Problemas RLS - Sistema COMERECO

**Fecha:** 2025-11-02
**Estado:** CRÍTICO - Sistema con errores de seguridad y permisos

---

## Resumen Ejecutivo

El sistema presenta **múltiples problemas críticos** en la configuración de Row Level Security (RLS), políticas de acceso y funciones personalizadas que impiden el funcionamiento correcto de la aplicación, especialmente para roles de **Admin** y **Supervisor**.

---

## Problemas Identificados

### 1. Vulnerabilidades de Seguridad (CRÍTICO)

#### 1.1 Search Path Mutable en Funciones Helper
**Severidad:** ALTA
**Impacto:** Posible inyección de search_path

**Funciones afectadas:**
- `is_admin()`
- `is_supervisor()`
- `get_user_role_v2()`
- `get_my_company_id()`

**Problema:**
Estas funciones no tienen `SET search_path` configurado, lo que las hace vulnerables a ataques de search_path injection.

**Solución:**
Agregar `SET search_path TO 'public'` a todas las funciones SECURITY DEFINER.

#### 1.2 Protección de Contraseñas Filtradas Deshabilitada
**Severidad:** MEDIA
**Impacto:** Los usuarios pueden usar contraseñas comprometidas

**Solución:**
Habilitar la protección contra contraseñas filtradas en Supabase Auth.

---

### 2. Funciones Redundantes

#### 2.1 `get_user_company_id()` vs `get_my_company_id()`
Ambas funciones hacen exactamente lo mismo:
```sql
-- get_user_company_id() - CON search_path (correcto)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$function$

-- get_my_company_id() - SIN search_path (vulnerable)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT company_id FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$function$
```

**Problema:**
- Confusión en el código (¿cuál usar?)
- `get_my_company_id()` no tiene search_path configurado (vulnerabilidad)
- Políticas usan ambas funciones indistintamente

**Solución:**
- Deprecar `get_my_company_id()`
- Reemplazar todas las referencias con `get_user_company_id()`
- O viceversa, pero agregar search_path a la que se conserve

---

### 3. Políticas RLS Legacy (Obsoletas)

#### 3.1 Políticas usando `app_role` en vez de `role_v2`
**Tabla:** `companies`
**Políticas afectadas:**
- `companies_super_admin_write`
- `companies_super_admin_update`

**Problema:**
Estas políticas usan el enum `app_role` (employee, admin_corp, super_admin) que está DEPRECATED.
El sistema actual usa `app_role_v2` (admin, supervisor, user).

**Impacto:**
Estas políticas NUNCA se activarán porque los usuarios tienen `role_v2` asignado, no `role`.

**Solución:**
Eliminar estas políticas legacy y asegurar que las políticas modernas cubran todos los casos.

---

### 4. Políticas Redundantes y Confusas

#### 4.1 Múltiples Políticas SELECT para la misma tabla

**Ejemplo: `requisitions`**
- `admin_select_all_company_requisitions` (SELECT)
- `supervisor_select_project_requisitions` (SELECT)
- `user_select_own_requisitions` (SELECT)

**Problema:**
En vez de 3 políticas separadas, se podría tener 1 política con condiciones OR, lo cual:
- Es más fácil de mantener
- Reduce la complejidad del plan de ejecución de PostgreSQL
- Es más fácil de entender y documentar

#### 4.2 Tabla `companies` con 5 políticas
```
- Users see own company (SELECT)
- companies_by_members (SELECT) - DUPLICADA
- Admins manage companies (ALL)
- companies_super_admin_write (INSERT) - LEGACY
- companies_super_admin_update (UPDATE) - LEGACY
```

**Problema:**
- 2 políticas SELECT hacen lo mismo
- 2 políticas LEGACY que nunca se activan

---

### 5. Políticas Faltantes (Funcionalidad Bloqueada)

Aunque hay muchas políticas, faltan algunas operaciones críticas:

#### 5.1 `bind_sync_logs`
- ✅ SELECT (usuarios pueden ver logs)
- ❌ INSERT (¿cómo se crean los logs?)
- ❌ UPDATE (no necesario probablemente)
- ❌ DELETE (admins deberían poder limpiar logs)

#### 5.2 `bind_mappings`
- ✅ SELECT (usuarios pueden ver)
- ✅ ALL para admins
- Está bien, pero podría ser más granular

---

## Impacto en el Frontend

### Síntomas Reportados:
1. ✅ Admins NO pueden ver todas las vistas → **FALSO** (frontend está bien)
2. ✅ Errores al navegar ciertas rutas → **PROBABLE** (funciones con nombre incorrecto)
3. ✅ Sistema se rompe al iniciar sesión → **PROBABLE** (políticas usando funciones incorrectas)

### Análisis Frontend:
El código del frontend está **CORRECTAMENTE implementado**:
- ✅ Usa `role_v2` correctamente
- ✅ Hook `useUserPermissions` bien estructurado
- ✅ Rutas protegidas con `PrivateRoute`
- ✅ Sidebar adaptado por rol

**El problema NO está en el frontend, está en el backend (RLS).**

---

## Arquitectura Recomendada

### Sistema de Roles
```
app_role_v2 (USAR ESTE):
├── admin      → Acceso total a su company
├── supervisor → Gestiona proyectos y aprobaciones
└── user       → Usuario estándar

app_role (DEPRECAR):
├── employee
├── admin_corp
└── super_admin (NO USAR)
```

### Funciones Helper (Consolidadas)
```sql
1. get_current_user_id()        → auth.uid()
2. get_current_user_company()   → company_id del usuario
3. get_current_user_role()      → role_v2 del usuario
4. is_admin()                   → role_v2 = 'admin'
5. is_supervisor()              → role_v2 = 'supervisor'
6. is_admin_or_supervisor()     → role_v2 IN ('admin', 'supervisor')
```

### Políticas RLS (Simplificadas)

**Principio:** 1 política por operación (SELECT/INSERT/UPDATE/DELETE), combinando condiciones con OR.

**Ejemplo para `requisitions`:**
```sql
-- SELECT: Consolidar 3 políticas en 1
CREATE POLICY "requisitions_select"
ON public.requisitions FOR SELECT
USING (
  company_id = get_current_user_company()
  AND (
    -- Admin: ve todas
    is_admin()
    OR
    -- Supervisor: ve las de sus proyectos
    (is_supervisor() AND project_id IN (
      SELECT id FROM projects WHERE supervisor_id = auth.uid()
    ))
    OR
    -- User: ve solo las suyas
    created_by = auth.uid()
  )
);
```

---

## Plan de Corrección

### Fase 1: Seguridad Crítica ⚠️
1. Agregar `SET search_path TO 'public'` a todas las funciones SECURITY DEFINER
2. Consolidar funciones redundantes
3. Eliminar políticas legacy

### Fase 2: Limpieza y Optimización
1. Consolidar políticas redundantes (múltiples SELECT → 1 SELECT)
2. Agregar políticas faltantes
3. Estandarizar nombres de funciones y políticas

### Fase 3: Pruebas
1. Verificar acceso de Admin a TODAS las vistas
2. Verificar acceso de Supervisor a sus proyectos
3. Verificar acceso de User a sus recursos
4. Ejecutar advisors de seguridad de Supabase

---

## Próximos Pasos

1. ✅ Crear migración SQL maestra con todas las correcciones
2. ⏳ Aplicar migración a Supabase
3. ⏳ Verificar advisors de seguridad
4. ⏳ Ejecutar pruebas de acceso
5. ⏳ Confirmar sistema 100% operativo

---

**Elaborado por:** Claude AI
**Revisión:** Pendiente
**Aprobación:** Pendiente
