-- Script SQL para crear el bucket de Storage para imágenes de productos
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Crear el bucket 'product-images'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Público para lectura, pero requiere autenticación para escritura
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política RLS para permitir lectura pública de imágenes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Política RLS para permitir que usuarios autenticados suban imágenes
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Política RLS para permitir que usuarios autenticados actualicen imágenes
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
CREATE POLICY "Users can update own product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- 5. Política RLS para permitir que usuarios autenticados eliminen imágenes
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
CREATE POLICY "Users can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

