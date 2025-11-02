-- ============================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS
-- Error 42P17: Tabla o columna no existe
-- ============================================

-- PASO 1: Verificar si la tabla profiles existe
-- Ejecuta esto primero para ver qué falta:
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Si el query anterior NO devuelve resultados, la tabla no existe.
-- Si devuelve resultados pero falta 'role_v2', necesitas agregar la columna.

-- ============================================
-- OPCIÓN A: Si la tabla NO existe (crear todo)
-- ============================================

-- 1. Crear enum para role_v2
DO $$ BEGIN
    CREATE TYPE app_role_v2 AS ENUM ('admin', 'supervisor', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla profiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id),
    full_name text,
    avatar_url text,
    role_v2 app_role_v2 DEFAULT 'user'::app_role_v2,
    updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas básicas de RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- OPCIÓN B: Si la tabla existe pero falta role_v2
-- ============================================

-- 1. Crear enum si no existe
DO $$ BEGIN
    CREATE TYPE app_role_v2 AS ENUM ('admin', 'supervisor', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Agregar columna role_v2 si no existe
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

-- ============================================
-- PASO 2: Crear el perfil para tu usuario
-- ============================================

-- Primero, verifica que exista una empresa
SELECT * FROM public.companies LIMIT 1;

-- Si NO existe ninguna empresa, créala:
INSERT INTO public.companies (name, bind_location_id, bind_price_list_id)
VALUES ('Solver', 'LOC-001', 'PRICE-001')
ON CONFLICT DO NOTHING
RETURNING *;

-- Ahora crea tu perfil de usuario
-- Usando el email que vi en el token: team@growpals.mx
-- Y el UUID: a9b3c244-9400-4d5c-8ce2-3ee9400a0af6

INSERT INTO public.profiles (id, company_id, full_name, role_v2)
SELECT
    'a9b3c244-9400-4d5c-8ce2-3ee9400a0af6'::uuid,
    (SELECT id FROM public.companies ORDER BY created_at DESC LIMIT 1),
    'Team Solver',
    'admin'::app_role_v2
ON CONFLICT (id)
DO UPDATE SET
    company_id = EXCLUDED.company_id,
    full_name = EXCLUDED.full_name,
    role_v2 = EXCLUDED.role_v2,
    updated_at = now()
RETURNING *;

-- ============================================
-- PASO 3: Verificar que todo esté correcto
-- ============================================

-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar tu perfil
SELECT
    p.id,
    p.full_name,
    p.role_v2,
    p.company_id,
    c.name as company_name,
    au.email
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'team@growpals.mx';

-- Si este último query devuelve un resultado, ¡todo está listo!

-- ============================================
-- PASO 4: Trigger para auto-crear perfil (opcional pero recomendado)
-- ============================================

-- Este trigger creará automáticamente un perfil cuando se registre un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role_v2)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role_v2')::app_role_v2, 'user'::app_role_v2)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT '✅ Script ejecutado correctamente' as status;
