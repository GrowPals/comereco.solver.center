-- Script para crear usuario de prueba en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- PASO 1: Verificar si tu usuario existe en auth.users
-- Reemplaza 'tu-email@ejemplo.com' con tu email real
SELECT id, email, created_at
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';

-- PASO 2: Si el usuario existe, copiar el UUID (id) y usarlo abajo
-- Si recibes un resultado, copia el 'id' (será algo como 'a1b2c3d4-...')

-- PASO 3: Verificar si existe una empresa
SELECT * FROM public.companies LIMIT 1;

-- Si NO existe ninguna empresa, créala primero:
INSERT INTO public.companies (name, bind_location_id, bind_price_list_id)
VALUES ('Empresa de Prueba', 'LOC-001', 'PRICE-001')
RETURNING *;

-- PASO 4: Copiar el ID de la empresa del resultado anterior

-- PASO 5: Crear el perfil para tu usuario
-- Reemplaza estos valores:
--   - 'EL-UUID-DE-AUTH-USERS' con el ID del PASO 1
--   - 'EL-UUID-DE-COMPANIES' con el ID del PASO 3 o 4
INSERT INTO public.profiles (id, company_id, full_name, role_v2)
VALUES (
  'EL-UUID-DE-AUTH-USERS',  -- Reemplazar con tu user ID de auth.users
  'EL-UUID-DE-COMPANIES',    -- Reemplazar con company ID
  'Usuario de Prueba',        -- Tu nombre
  'admin'                     -- Rol: admin, supervisor, o user
)
ON CONFLICT (id)
DO UPDATE SET
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  role_v2 = EXCLUDED.role_v2,
  updated_at = now()
RETURNING *;

-- PASO 6: Verificar que el perfil fue creado correctamente
SELECT
  p.id,
  p.full_name,
  p.role_v2,
  p.company_id,
  c.name as company_name,
  au.email
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'tu-email@ejemplo.com';

-- Si este último query devuelve un resultado con todos los campos llenos,
-- el perfil está correctamente configurado y deberías poder hacer login.
