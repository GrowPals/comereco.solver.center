# 📊 Estado General de la Base de Datos - ComerECO

**Fecha de revisión**: 2025-11-02  
**Estado**: ⚠️ Requiere corrección de políticas RLS

---

## 🔴 Problemas Críticos Identificados

### 1. Recursión Infinita en Políticas RLS

**Error**: `42P17 - infinite recursion detected in policy for relation "project_members"`

**Causa**: 
- Las políticas de `project_members` llaman funciones (`is_admin()`, `is_supervisor()`) que consultan `profiles`
- Las políticas de `profiles` consultan `project_members`
- Ciclo infinito de dependencias

**Impacto**: 
- ❌ No se pueden consultar `profiles` → Error 500
- ❌ No se pueden consultar `products` → Error 500  
- ❌ No se pueden consultar `project_members` → Error 500
- ❌ La aplicación muestra pantalla en blanco o errores

**Solución**: ✅ Script creado en `scripts/fix-database-rls-recursion.sql`

---

## ✅ Estado de Tablas Principales

### Tablas con RLS Habilitado
- ✅ `companies`
- ✅ `profiles` ⚠️ (políticas con recursión)
- ✅ `products`
- ✅ `projects`
- ✅ `project_members` ⚠️ (políticas con recursión)
- ✅ `requisitions`
- ✅ `requisition_items`
- ✅ `requisition_templates`
- ✅ `notifications`
- ✅ `audit_log`
- ✅ `user_favorites`
- ✅ `user_cart_items`
- ✅ `folio_counters`

### Funciones Helper Existentes
- ✅ `is_admin()` - ⚠️ Necesita actualización (sin SECURITY DEFINER)
- ✅ `is_supervisor()` - ⚠️ Necesita actualización (sin SECURITY DEFINER)
- ✅ `get_my_company_id()` - ✅ Funciona correctamente
- ⚠️ `get_user_role_v2()` - ❌ No existe (necesaria)

---

## 🔧 Cambios Necesarios

### Cambios Automáticos (Script SQL)

**Archivo**: `scripts/fix-database-rls-recursion.sql`

Este script aplica automáticamente:

1. ✅ Actualiza `is_admin()` con `SECURITY DEFINER`
2. ✅ Actualiza `is_supervisor()` con `SECURITY DEFINER`
3. ✅ Crea `get_user_role_v2()` con `SECURITY DEFINER`
4. ✅ Simplifica políticas de `profiles` sin recursión
5. ✅ Recrea políticas de `project_members` optimizadas

**Cómo aplicar**: Ver `docs/INSTRUCCIONES_FIX_RLS_RECURSION.md`

### Cambios Manuales Requeridos

#### 1. Ejecutar Script SQL en Supabase

**Pasos**:
1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido de `scripts/fix-database-rls-recursion.sql`
3. Ejecuta el script
4. Verifica que no haya errores

**Verificación**:
```sql
-- Debería funcionar sin errores
SELECT * FROM public.profiles WHERE id = auth.uid() LIMIT 1;
SELECT * FROM public.project_members WHERE user_id = auth.uid() LIMIT 1;
```

#### 2. Verificar Funciones Helper

Después de ejecutar el script, verifica:

```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  CASE provolatile 
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc
WHERE proname IN ('is_admin', 'is_supervisor', 'get_user_role_v2', 'get_my_company_id')
ORDER BY proname;
```

**Resultado esperado**:
- `is_security_definer` = `true` para todas las funciones
- `volatility` = `STABLE` para todas las funciones

#### 3. Verificar Políticas Actualizadas

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual::text as policy_definition
FROM pg_policies
WHERE tablename IN ('project_members', 'profiles')
ORDER BY tablename, policyname;
```

---

## 📋 Checklist de Verificación

### Antes de Aplicar Cambios
- [ ] Haz backup de la base de datos (opcional pero recomendado)
- [ ] Revisa el script SQL (`scripts/fix-database-rls-recursion.sql`)
- [ ] Verifica que tienes permisos de administrador en Supabase

### Después de Aplicar Cambios
- [ ] Script ejecutado sin errores
- [ ] Funciones helper verificadas (SECURITY DEFINER = true)
- [ ] Políticas verificadas (sin dependencias circulares)
- [ ] Query de prueba funciona: `SELECT * FROM profiles WHERE id = auth.uid()`
- [ ] Query de prueba funciona: `SELECT * FROM project_members WHERE user_id = auth.uid()`
- [ ] La aplicación carga correctamente sin errores 500
- [ ] Dashboard muestra estadísticas (aunque sean 0)
- [ ] Catálogo muestra productos (o mensaje vacío)

---

## 🎯 Resultado Esperado

Después de aplicar los cambios:

### ✅ Funcionalidades Restauradas
- ✅ Carga de perfil de usuario
- ✅ Carga de productos del catálogo
- ✅ Carga de estadísticas del dashboard
- ✅ Carga de requisiciones recientes
- ✅ Navegación entre páginas sin errores

### ✅ UI Mostrará
- Dashboard con estadísticas en 0 (si no hay datos)
- Catálogo con mensaje "No se encontraron productos" (si no hay productos)
- Tabla de requisiciones con mensaje "No hay requisiciones recientes" (si no hay requisiciones)

### ⚠️ Errores que Desaparecerán
- ❌ `infinite recursion detected in policy for relation "project_members"` → ✅ Resuelto
- ❌ Error 500 en queries a `profiles` → ✅ Resuelto
- ❌ Error 500 en queries a `products` → ✅ Resuelto
- ❌ Pantalla en blanco → ✅ Resuelto

---

## 📚 Documentación Relacionada

- **Script SQL**: `scripts/fix-database-rls-recursion.sql`
- **Instrucciones**: `docs/INSTRUCCIONES_FIX_RLS_RECURSION.md`
- **Referencia Técnica**: `docs/guides/REFERENCIA_TECNICA_BD_SUPABASE.md`
- **Fix Original**: `docs/api/FIX_RLS_RECURSION.sql`

---

## 🔍 Análisis Técnico Detallado

### Dependencias Circulares Identificadas

```
project_members (SELECT) 
  → is_admin() / is_supervisor()
    → profiles (SELECT)
      → project_members (SELECT) 
        → ... (recursión infinita)
```

### Solución Aplicada

```
project_members (SELECT)
  → is_admin() / is_supervisor() [SECURITY DEFINER]
    → profiles (SELECT) [bypass RLS]
      → ✅ Sin recursión
```

### Funciones con SECURITY DEFINER

- `is_admin()`: Bypass RLS para consultar `profiles.role_v2`
- `is_supervisor()`: Bypass RLS para consultar `profiles.role_v2`
- `get_user_role_v2()`: Bypass RLS para obtener rol sin recursión
- `get_my_company_id()`: Bypass RLS para obtener company_id

**Seguridad**: ✅ Seguro porque solo consultan `auth.uid()` del contexto de autenticación.

---

## ⚡ Próximos Pasos Recomendados

1. **Inmediato**: Ejecutar script SQL para corregir recursión
2. **Corto plazo**: Verificar que todas las queries funcionan correctamente
3. **Mediano plazo**: Optimizar políticas RLS adicionales (hay 6 políticas con re-evaluación de funciones auth)
4. **Largo plazo**: Considerar migración a funciones más eficientes si el rendimiento se ve afectado

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de Postgres en Supabase Dashboard
2. Verifica las queries de prueba en el script SQL
3. Consulta la documentación técnica en `docs/guides/`
4. Revisa los mensajes de error específicos en la consola del navegador

---

**Última actualización**: 2025-11-02  
**Estado**: ⚠️ Requiere acción manual (ejecutar script SQL)

