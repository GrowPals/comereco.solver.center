-- ===================================================================
-- SCRIPT DE VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
-- Ejecutar en Supabase SQL Editor para verificar tablas y funciones
-- ===================================================================

-- 1. Verificar existencia de tabla user_cart_items
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_cart_items'
ORDER BY ordinal_position;

-- 2. Verificar existencia de tabla requisition_items
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'requisition_items'
ORDER BY ordinal_position;

-- 3. Verificar funciones RPC existentes
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'clear_user_cart',
    'create_full_requisition',
    'submit_requisition',
    'approve_requisition',
    'reject_requisition'
  )
ORDER BY routine_name;

-- 4. Verificar políticas RLS en user_cart_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_cart_items';

-- 5. Verificar políticas RLS en requisition_items
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'requisition_items';

-- 6. Verificar estructura completa de requisitions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'requisitions'
ORDER BY ordinal_position;

-- 7. Verificar tabla folio_counters
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'folio_counters'
ORDER BY ordinal_position;

