-- ===================================================================
-- MIGRACIÓN: Asegurar default UUID para projects.id
-- Fecha: 2025-02-05
-- Descripción:
--   Configura la columna id de public.projects para que genere un UUID
--   automáticamente cuando no se proporciona al insertar un registro.
--   Esto previene el error "null value in column 'id' violates not-null constraint".
-- ===================================================================

-- Asegurar extensión uuid-ossp disponible (no hace nada si ya existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Establecer default a gen_random_uuid (proporcionado por pgcrypto)
ALTER TABLE public.projects
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- NOTA: Si la columna ya tenía FK/PK no se modifica nada más.
