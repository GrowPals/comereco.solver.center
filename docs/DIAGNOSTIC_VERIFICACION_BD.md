# 🔍 Diagnóstico: Error 500 en Profiles

## ❌ Problema Actual

Sigues recibiendo error 500 al intentar obtener el perfil:
```
azjaehrdzdfgrumbqmuc.supabase.co/rest/v1/profiles?select=...&id=eq.a9b3c244-9400-4d5c-8ce2-3ee9400a0af6
Failed to load resource: the server responded with a status of 500
```

Esto indica que **la tabla profiles aún no está configurada correctamente** en tu base de datos de Supabase.

---

## ✅ Pasos de Verificación

### 1. Confirmar que estás en el proyecto correcto

Ve a: https://supabase.com/dashboard/projects

**Asegúrate de que estás en el proyecto:** `azjaehrdzdfgrumbqmuc`

El URL debe ser: `https://supabase.com/dashboard/project/azjaehrdzdfgrumbqmuc`

---

### 2. Verificar si la tabla profiles existe

1. Ve al **SQL Editor** en Supabase
2. Ejecuta este query simple:

```sql
-- Ver si la tabla existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'profiles';
```

**Resultado esperado:**
- Si devuelve una fila con `profiles` → La tabla existe ✅
- Si no devuelve nada → La tabla NO existe ❌

---

### 3. Verificar la estructura de la tabla profiles

Si la tabla existe, ejecuta:

```sql
-- Ver todas las columnas de la tabla profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Resultado esperado:**

| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| id | uuid | NO |
| company_id | uuid | YES |
| full_name | text | YES |
| avatar_url | text | YES |
| role_v2 | USER-DEFINED | YES |
| updated_at | timestamp with time zone | YES |

**Columnas requeridas:**
- ✅ `id` (uuid)
- ✅ `company_id` (uuid)
- ✅ `full_name` (text)
- ✅ `role_v2` (USER-DEFINED - esto es el enum)

---

### 4. Verificar que tu perfil existe

```sql
-- Ver si existe un perfil para tu usuario
SELECT
  p.*,
  au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'team@growpals.mx';
```

**Resultado esperado:**

| id | company_id | full_name | role_v2 | email |
|----|------------|-----------|---------|-------|
| a9b3c244-... | (algún UUID) | Team Solver | admin | team@growpals.mx |

**Si NO devuelve nada:** Tu perfil no existe y necesitas crearlo.

---

### 5. Verificar las políticas RLS (Row Level Security)

```sql
-- Ver las políticas de la tabla profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles';
```

**Deberías ver al menos 2 políticas:**
1. "Users can view their own profile" (SELECT)
2. "Users can update their own profile" (UPDATE)

---

## 🔧 Soluciones Según el Resultado

### Caso A: La tabla NO existe
**Acción:** Ejecutar TODO el script `FIX_DATABASE_STRUCTURE.sql`

1. Abre: `/docs/FIX_DATABASE_STRUCTURE.sql`
2. Copia **TODO el contenido** (desde línea 1 hasta el final)
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **RUN**

---

### Caso B: La tabla existe pero falta la columna `role_v2`
**Acción:** Ejecutar solo la sección de agregar columna:

```sql
-- Crear enum si no existe
DO $$ BEGIN
    CREATE TYPE app_role_v2 AS ENUM ('admin', 'supervisor', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar columna role_v2 si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'role_v2'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN role_v2 app_role_v2 DEFAULT 'user'::app_role_v2;
    END IF;
END $$;
```

---

### Caso C: La tabla existe pero tu perfil no existe
**Acción:** Crear tu perfil manualmente:

```sql
-- Primero, obtén el ID de una empresa
SELECT id, name FROM public.companies LIMIT 1;

-- Si NO hay empresas, créala primero:
INSERT INTO public.companies (name, bind_location_id, bind_price_list_id)
VALUES ('Solver', 'LOC-001', 'PRICE-001')
RETURNING id, name;

-- Luego crea tu perfil (reemplaza COMPANY_ID con el UUID de arriba)
INSERT INTO public.profiles (id, company_id, full_name, role_v2)
VALUES (
  'a9b3c244-9400-4d5c-8ce2-3ee9400a0af6'::uuid,
  'COMPANY_ID_AQUI'::uuid,  -- Reemplazar con el UUID de la empresa
  'Team Solver',
  'admin'::app_role_v2
)
ON CONFLICT (id)
DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  role_v2 = EXCLUDED.role_v2,
  updated_at = now()
RETURNING *;
```

---

### Caso D: Todo existe pero sigues teniendo error 500
**Posible causa:** Las políticas RLS están bloqueando el acceso

**Solución temporal para diagnóstico:**

```sql
-- TEMPORALMENTE deshabilitar RLS para probar
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Después de probar el login, volver a habilitarlo:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**IMPORTANTE:** Esto es solo para diagnóstico. Una vez que confirmes que funciona, vuelve a habilitar RLS.

---

## 📸 Información que Necesito

Por favor, ejecuta los queries de verificación (pasos 2, 3, 4, 5) y comparte:

1. **Screenshot del resultado del Paso 2** (verificar si tabla existe)
2. **Screenshot del resultado del Paso 3** (estructura de la tabla)
3. **Screenshot del resultado del Paso 4** (tu perfil)
4. **Screenshot del resultado del Paso 5** (políticas RLS)

Con esta información podré darte la solución exacta.

---

## 🎯 Próximos Pasos

Una vez que la base de datos esté correctamente configurada:
1. Hacer un hard reload en el navegador (Ctrl + Shift + R)
2. Intentar login nuevamente
3. Verificar que los logs en consola muestren ✅ en vez de ❌
