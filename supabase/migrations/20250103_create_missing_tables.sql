-- ===================================================================
-- MIGRACIÓN: Crear tablas faltantes si no existen
-- Fecha: 2025-01-03
-- Propósito: Asegurar que todas las tablas necesarias para el flujo de carrito existen
-- ===================================================================

-- ===================================================================
-- 1. Tabla user_cart_items (si no existe)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.user_cart_items (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- Índices para user_cart_items
CREATE INDEX IF NOT EXISTS idx_user_cart_items_user_id ON public.user_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cart_items_product_id ON public.user_cart_items(product_id);

-- RLS para user_cart_items
ALTER TABLE public.user_cart_items ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden gestionar su propio carrito
DROP POLICY IF EXISTS "Users can only manage their own cart items" ON public.user_cart_items;
CREATE POLICY "Users can only manage their own cart items"
  ON public.user_cart_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comentario
COMMENT ON TABLE public.user_cart_items IS 
'Carrito de compras por usuario. Relación N:N entre usuarios y productos con cantidad.';

-- ===================================================================
-- 2. Tabla requisition_items (si no existe)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.requisition_items (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  requisition_id uuid NOT NULL REFERENCES public.requisitions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para requisition_items
CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition_id ON public.requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_product_id ON public.requisition_items(product_id);

-- RLS para requisition_items
ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver items de requisiciones que tienen permiso de ver
DROP POLICY IF EXISTS "Users can view items of requisitions they are allowed to see" ON public.requisition_items;
CREATE POLICY "Users can view items of requisitions they are allowed to see"
  ON public.requisition_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.requisitions r
      WHERE r.id = requisition_items.requisition_id
        AND (
          -- Es el creador
          r.created_by = auth.uid()
          -- O es supervisor del proyecto
          OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = r.project_id
              AND p.supervisor_id = auth.uid()
          )
          -- O es admin de la empresa
          OR EXISTS (
            SELECT 1 FROM public.profiles pr
            WHERE pr.id = auth.uid()
              AND pr.role_v2 = 'admin'
              AND pr.company_id = r.company_id
          )
          -- O es miembro del proyecto
          OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = r.project_id
              AND pm.user_id = auth.uid()
          )
        )
    )
  );

-- Comentario
COMMENT ON TABLE public.requisition_items IS 
'Items/líneas de productos de cada requisición. Relación 1:N con requisitions.';

-- ===================================================================
-- 3. Tabla folio_counters (si no existe)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.folio_counters (
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year integer NOT NULL CHECK (year >= 2000 AND year <= 2100),
  last_folio_number integer NOT NULL DEFAULT 0 CHECK (last_folio_number >= 0),
  PRIMARY KEY (company_id, year)
);

-- Índice para folio_counters
CREATE INDEX IF NOT EXISTS idx_folio_counters_company_year ON public.folio_counters(company_id, year);

-- RLS para folio_counters (solo lectura para autenticados, escritura via RPCs)
ALTER TABLE public.folio_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their company folio counters" ON public.folio_counters;
CREATE POLICY "Users can view their company folio counters"
  ON public.folio_counters
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Comentario
COMMENT ON TABLE public.folio_counters IS 
'Contador de folios internos por empresa y año. Usado para generar folios únicos tipo REQ-2025-0001.';

-- ===================================================================
-- 4. Trigger para actualizar updated_at en user_cart_items
-- ===================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_cart_items_updated_at ON public.user_cart_items;
CREATE TRIGGER update_user_cart_items_updated_at
  BEFORE UPDATE ON public.user_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================================================
-- FIN DE LA MIGRACIÓN
-- ===================================================================

