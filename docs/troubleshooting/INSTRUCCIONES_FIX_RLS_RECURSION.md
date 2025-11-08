# 🔧 Instrucciones para Corregir Recursión Infinita en RLS

## Problema Identificado

Error: `42P17 - infinite recursion detected in policy for relation "project_members"`

**Causa**: Las políticas RLS de `project_members` llaman a funciones (`is_admin()`, `is_supervisor()`) que consultan `profiles`, y las políticas de `profiles` consultan `project_members`, creando un ciclo infinito.

## Solución

Se ha creado un script SQL completo que corrige el problema aplicando:

1. **Funciones helper con SECURITY DEFINER**: Bypass RLS para evitar recursión
2. **Políticas simplificadas**: Evitan dependencias circulares
3. **Uso de `role_v2`**: Campo correcto para verificar roles

## Pasos para Aplicar el Fix

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Ve al Dashboard de Supabase**
   - Abre tu proyecto en https://supabase.com/dashboard
   - Navega a **SQL Editor**

2. **Ejecuta el Script**
   - Abre el archivo `scripts/fix-database-rls-recursion.sql`
   - Copia todo el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **Run** o presiona `Ctrl+Enter`

3. **Verifica los Resultados**
   - Deberías ver mensajes de éxito en la consola
   - Las queries de verificación al final mostrarán las funciones y políticas actualizadas

### Opción 2: Desde Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db execute --file scripts/fix-database-rls-recursion.sql
```

### Opción 3: Desde psql (Conexión Directa)

```bash
# Conecta a tu base de datos
psql "postgresql://postgres:[TU_PASSWORD]@[TU_HOST]:5432/postgres"

# Ejecuta el script
\i scripts/fix-database-rls-recursion.sql
```

## Verificación Manual

Después de aplicar el fix, verifica que todo funciona:

### 1. Verificar Funciones Helper

```sql
-- Deberían mostrar is_security_definer = true
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname IN ('is_admin', 'is_supervisor', 'get_user_role_v2', 'get_my_company_id')
ORDER BY proname;
```

### 2. Verificar Políticas

```sql
-- Ver políticas de project_members
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies
WHERE tablename = 'project_members'
ORDER BY policyname;
```

### 3. Probar Query que Causaba Error

```sql
-- Esta query debería funcionar sin recursion
SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;

-- Esta también debería funcionar
SELECT * FROM public.project_members WHERE user_id = auth.uid() LIMIT 1;
```

## Cambios Aplicados

### Funciones Actualizadas

- ✅ `is_admin()`: Ahora usa `SECURITY DEFINER` y consulta `role_v2` directamente
- ✅ `is_supervisor()`: Ahora usa `SECURITY DEFINER` y consulta `role_v2` directamente
- ✅ `get_user_role_v2()`: Nueva función helper con `SECURITY DEFINER`
- ✅ `get_my_company_id()`: Nueva función helper con `SECURITY DEFINER`

### Políticas Recreadas

- ✅ `project_members`: Políticas simplificadas sin dependencias circulares
- ✅ `profiles`: Políticas simplificadas que no consultan `project_members` directamente

## Si Persisten Problemas

### 1. Verificar Logs de Supabase

- Ve a **Logs** → **Postgres Logs** en el dashboard
- Busca errores relacionados con `project_members` o `profiles`

### 2. Verificar que RLS Está Habilitado

```sql
-- Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('project_members', 'profiles');
```

### 3. Deshabilitar Temporalmente Políticas Problemáticas

Si necesitas debuggear, puedes deshabilitar temporalmente una política:

```sql
-- SOLO PARA DEBUG - NO EN PRODUCCIÓN
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
-- Luego rehabilita:
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
```

## Notas Importantes

⚠️ **SECURITY DEFINER**: Las funciones helper usan `SECURITY DEFINER` lo que significa que ejecutan con permisos del propietario de la función (normalmente `postgres`). Esto es seguro porque solo consultan `auth.uid()` que viene del contexto de autenticación.

✅ **STABLE**: Las funciones están marcadas como `STABLE` porque siempre devuelven el mismo resultado para el mismo `auth.uid()` en la misma transacción.

✅ **Multi-tenant**: Todas las políticas siguen filtrando por `company_id` para mantener el aislamiento de datos.

## Resultado Esperado

Después de aplicar este fix:

- ✅ Las queries a `profiles` y `project_members` funcionarán sin errores de recursión
- ✅ La aplicación podrá cargar datos del usuario correctamente
- ✅ Los dashboards mostrarán estadísticas en lugar de errores 500
- ✅ Los productos se podrán listar correctamente

## Contacto

Si encuentras problemas al aplicar este fix, revisa:
1. Los mensajes de error en el SQL Editor
2. Los logs de Postgres en Supabase Dashboard
3. La documentación técnica en `docs/guides/REFERENCIA_TECNICA_BD_SUPABASE.md`

