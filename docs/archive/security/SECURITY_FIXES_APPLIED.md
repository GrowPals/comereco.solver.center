# Security Fixes Applied - COMERECO-WEBAPP

## 📅 Date: 2025-11-05

Este documento detalla las correcciones de seguridad aplicadas en respuesta a los warnings del Supabase Database Linter.

---

## 🔴 Issues Detectados y Resueltos

### 1. Security Definer View (ERROR) ✅ CORREGIDO

**Problema:** La vista `inventory_restock_rules_view` estaba definida con `SECURITY DEFINER`, lo que ejecuta la vista con los permisos del creador en lugar del usuario que consulta.

**Riesgo:** Bypass potencial de políticas RLS si el creador tiene más permisos que el usuario consultante.

**Solución Aplicada:**
```sql
-- ANTES (INSEGURO)
CREATE VIEW inventory_restock_rules_view AS ...;
-- Por defecto usa SECURITY DEFINER

-- DESPUÉS (SEGURO)
CREATE VIEW inventory_restock_rules_view
WITH (security_invoker = true)  -- ✅ Usa permisos del usuario consultante
AS ...;
```

**Beneficio:**
- RLS se aplica correctamente según el usuario que consulta
- No hay bypass de permisos
- Mantiene aislamiento multi-tenant

**Migración:** [20251106080000_fix_security_issues.sql](../supabase/migrations/20251106080000_fix_security_issues.sql)

---

### 2. Function Search Path Mutable (WARN) ✅ CORREGIDO

**Problema:** Tres funciones no tenían el `search_path` configurado explícitamente:
1. `normalize_invitation_email()`
2. `create_full_requisition()`
3. `update_products_updated_at()`

**Riesgo:** Ataque de "search path injection" donde un usuario malicioso puede crear objetos en schemas temporales que se ejecutan en lugar de las funciones legítimas.

**Solución Aplicada:**
```sql
-- ANTES (VULNERABLE)
CREATE FUNCTION normalize_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$...$$;

-- DESPUÉS (SEGURO)
CREATE FUNCTION normalize_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ✅ Path explícito y seguro
AS $$...$$;
```

**Funciones Corregidas:**

#### `normalize_invitation_email()`
- **Tipo:** Trigger
- **Propósito:** Normaliza emails a lowercase y trim
- **Fix:** Agregado `SET search_path = public, pg_temp`

#### `create_full_requisition()`
- **Tipo:** Function
- **Propósito:** Crea requisición completa con items
- **Fix:** Agregado `SET search_path = public, pg_temp`

#### `update_products_updated_at()`
- **Tipo:** Trigger
- **Propósito:** Auto-actualiza timestamp
- **Fix:** Agregado `SET search_path = public, pg_temp`

**Beneficio:**
- Previene ataques de search path injection
- Garantiza que las funciones solo usen objetos del schema `public`
- `pg_temp` permite temp tables sin riesgo

---

### 3. Restock Alerts Dashboard View ✅ CORREGIDO (Proactivo)

**Acción:** Aunque no estaba en los warnings, aplicamos el mismo fix a `restock_alerts_dashboard` por consistencia.

**Solución:**
```sql
CREATE VIEW restock_alerts_dashboard
WITH (security_invoker = true)  -- ✅ Seguro desde el inicio
AS ...;
```

---

## ⚠️ Configuración Adicional Requerida (Dashboard)

### 4. Leaked Password Protection (WARN) - CONFIGURACIÓN MANUAL

**Problema:** La protección contra contraseñas comprometidas está deshabilitada.

**Riesgo:** Los usuarios pueden usar contraseñas que han sido expuestas en brechas de seguridad públicas.

**Solución:** Habilitar en Supabase Dashboard

**Pasos para Configurar:**

1. **Ir al Dashboard de Supabase:**
   - https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc

2. **Navegar a Authentication → Policies:**
   - Click en "Authentication" en la barra lateral
   - Seleccionar "Policies"

3. **Habilitar Leaked Password Protection:**
   - Buscar la sección "Password Security"
   - Activar el toggle "Leaked Password Protection"
   - Esto habilitará la verificación contra [HaveIBeenPwned.org](https://haveibeenpwned.com/)

4. **Configuraciones Recomendadas:**
   ```
   ✅ Leaked Password Protection: ON
   ✅ Minimum Password Length: 8 caracteres
   ✅ Require Special Characters: Recomendado
   ✅ Require Numbers: Recomendado
   ✅ Require Uppercase: Recomendado
   ```

**Documentación:** [Password Security Guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

**Nota:** Esta configuración no se puede hacer vía SQL, solo desde el Dashboard.

---

## 🔍 Verificación de Correcciones

### Verificar Vistas con security_invoker

```sql
SELECT
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname LIKE '%restock%';

-- Verificar que contengan: WITH (security_invoker = true)
```

### Verificar search_path en Funciones

```sql
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS is_security_definer,
    p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'normalize_invitation_email',
      'create_full_requisition',
      'update_products_updated_at'
  );

-- Verificar que proconfig contenga: {search_path=public,pg_temp}
```

### Resultado Esperado

```sql
function_name                | is_security_definer | config_settings
-----------------------------+--------------------+------------------------
normalize_invitation_email   | true               | {search_path=public,pg_temp}
create_full_requisition      | true               | {search_path=public,pg_temp}
update_products_updated_at   | true               | {search_path=public,pg_temp}
```

---

## 📊 Estado Actual de Seguridad

### Antes de las Correcciones
```
🔴 ERROR: 1 (security_definer_view)
⚠️  WARN: 4 (3 function_search_path + 1 auth_leaked_password)
Total Issues: 5
```

### Después de las Correcciones
```
✅ ERROR: 0 (security_definer_view corregido)
✅ WARN: 1 (solo auth_leaked_password - requiere dashboard)
Total Issues Resueltos en DB: 4/5 (80%)
```

**Nota:** El último warning (auth_leaked_password) debe resolverse en el Dashboard de Supabase.

---

## 🛡️ Mejores Prácticas de Seguridad Implementadas

### 1. Vistas con SECURITY INVOKER
```sql
-- ✅ CORRECTO: RLS se aplica al usuario consultante
CREATE VIEW my_view
WITH (security_invoker = true)
AS SELECT ...;

-- ❌ EVITAR: RLS se aplica al creador de la vista
CREATE VIEW my_view
WITH (security_definer = true)
AS SELECT ...;
```

### 2. Funciones con search_path Explícito
```sql
-- ✅ CORRECTO: Path explícito y seguro
CREATE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$...$$;

-- ❌ EVITAR: Sin search_path (vulnerable)
CREATE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$...$$;
```

### 3. Uso de SECURITY DEFINER vs SECURITY INVOKER

**SECURITY DEFINER** - Usar cuando:
- ✅ La función necesita acceso elevado (ej: crear usuarios)
- ✅ Necesita bypassear RLS temporalmente (con cuidado)
- ✅ Debe ser combinado con `SET search_path`

**SECURITY INVOKER** (default) - Usar cuando:
- ✅ La función opera con permisos del usuario
- ✅ RLS debe aplicarse normalmente
- ✅ Es la opción más segura por defecto

---

## 🔧 Mantenimiento Futuro

### Checklist para Nuevas Funciones

Al crear nuevas funciones `SECURITY DEFINER`, siempre:

```sql
CREATE FUNCTION my_new_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ⚠️ NUNCA OLVIDAR ESTO
AS $$
BEGIN
    -- Tu código aquí
END;
$$;
```

### Checklist para Nuevas Vistas

Al crear nuevas vistas, preferir:

```sql
CREATE VIEW my_new_view
WITH (security_invoker = true)  -- ⚠️ PREFERIR ESTO
AS
SELECT ...;
```

Solo usar `security_definer = true` si hay una razón específica y documentada.

### Lint Regular

Ejecutar el linter periódicamente:

```bash
# Desde Supabase Dashboard
# Navigate to: Database → Linter

# O usar CLI (próximamente)
supabase db lint
```

---

## 📚 Referencias

### Supabase Docs
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)

### PostgreSQL Security
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Search Path Attacks](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

### OWASP
- [Injection Attacks](https://owasp.org/www-community/Injection_Theory)
- [Database Security](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)

---

## ✅ Resumen

### Correcciones Aplicadas
1. ✅ **security_definer_view** - Vista corregida a `security_invoker`
2. ✅ **normalize_invitation_email** - Agregado `search_path`
3. ✅ **create_full_requisition** - Agregado `search_path`
4. ✅ **update_products_updated_at** - Agregado `search_path`
5. ✅ **restock_alerts_dashboard** - Creada con `security_invoker`

### Acción Requerida (Manual)
- ⏰ Habilitar "Leaked Password Protection" en Dashboard de Supabase

### Migración Aplicada
- **Archivo:** `supabase/migrations/20251106080000_fix_security_issues.sql`
- **Estado:** ✅ Aplicada correctamente
- **Líneas:** 165 líneas de SQL
- **Fecha:** 2025-11-05

---

**Last Updated**: 2025-11-05
**Security Level**: 🟢 HIGH (4/5 issues resolved)
**Pending Manual Config**: 1 (auth_leaked_password)
**Maintained By**: Security Team
