-- ============================================
-- BIND ERP - IDs REALES PARA SUPABASE
-- ============================================
-- Fecha: 2025-11-02
-- Fuente: Ingeniería inversa de API real
-- ============================================

-- ============================================
-- PASO 1: Insertar Mapeos en bind_mappings
-- ============================================

-- MAPEO 1: Cliente Principal (Soluciones a la Orden)
INSERT INTO public.bind_mappings (
    company_id,
    mapping_type,
    supabase_id,
    bind_id,
    bind_data,
    is_active
)
SELECT
    c.id,
    'client',
    NULL,  -- NULL porque es mapeo a nivel empresa
    'd02c1c47-c9a5-4728-93a0-29e6b6136a15',  -- ✅ ClientID REAL de Bind
    jsonb_build_object(
        'client_name', 'Soluciones a la Orden',
        'client_number', 'CLI-001',
        'rfc', 'SOL123456ABC',
        'mapped_at', NOW()
    ),
    true
FROM public.companies c
WHERE c.name ILIKE '%soluciones%'  -- Buscar por nombre
LIMIT 1
ON CONFLICT (company_id, mapping_type, supabase_id) DO UPDATE
SET bind_id = EXCLUDED.bind_id,
    bind_data = EXCLUDED.bind_data,
    updated_at = NOW();

-- MAPEO 2: Almacén Principal (Matriz)
INSERT INTO public.bind_mappings (
    company_id,
    mapping_type,
    supabase_id,
    bind_id,
    bind_data,
    is_active
)
SELECT
    c.id,
    'warehouse',
    NULL,
    'a8605382-7b48-47e2-9fb6-a25cfb7cf735',  -- ✅ WarehouseID REAL (Matriz)
    jsonb_build_object(
        'warehouse_name', 'Matriz',
        'location_id', 'd7ef64f2-fd1e-437a-bd93-af01985be5a5',
        'mapped_at', NOW()
    ),
    true
FROM public.companies c
WHERE c.name ILIKE '%soluciones%'
LIMIT 1
ON CONFLICT (company_id, mapping_type, supabase_id) DO UPDATE
SET bind_id = EXCLUDED.bind_id,
    bind_data = EXCLUDED.bind_data,
    updated_at = NOW();

-- MAPEO 3: Ubicación/Location
INSERT INTO public.bind_mappings (
    company_id,
    mapping_type,
    supabase_id,
    bind_id,
    bind_data,
    is_active
)
SELECT
    c.id,
    'location',
    NULL,
    'd7ef64f2-fd1e-437a-bd93-af01985be5a5',  -- ✅ LocationID REAL
    jsonb_build_object(
        'location_name', 'Ubicación Principal',
        'mapped_at', NOW()
    ),
    true
FROM public.companies c
WHERE c.name ILIKE '%soluciones%'
LIMIT 1
ON CONFLICT (company_id, mapping_type, supabase_id) DO UPDATE
SET bind_id = EXCLUDED.bind_id,
    bind_data = EXCLUDED.bind_data,
    updated_at = NOW();

-- ============================================
-- PASO 2: Actualizar Tabla companies
-- ============================================

-- Agregar campos de configuración BIND si no existen
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS bind_price_list_id TEXT,
ADD COLUMN IF NOT EXISTS bind_currency_id TEXT,
ADD COLUMN IF NOT EXISTS bind_address_id TEXT,
ADD COLUMN IF NOT EXISTS bind_location_id TEXT;

-- Actualizar empresa con IDs reales de BIND
UPDATE public.companies
SET
    bind_location_id = 'd7ef64f2-fd1e-437a-bd93-af01985be5a5',  -- ✅ LocationID
    bind_price_list_id = '1d5f1d2f-7cd1-4e44-83cc-d47789f70b51',  -- ✅ PriceListID
    bind_currency_id = 'b7e2c065-bd52-40ca-b508-3accdd538860',  -- ✅ CurrencyID (MXN)
    bind_address_id = 'efff1744-da2f-499d-952f-20b9140a95bf',  -- ✅ AddressID
    updated_at = NOW()
WHERE name ILIKE '%soluciones%';

-- ============================================
-- PASO 3: Actualizar Función build_bind_payload()
-- ============================================

CREATE OR REPLACE FUNCTION public.build_bind_payload(requisition_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    payload JSONB;
BEGIN
    SELECT jsonb_build_object(
        -- Metadata de requisición
        'requisition_id', r.id,
        'internal_folio', r.internal_folio,

        -- IDs de BIND (obtenidos de mappings y companies)
        'company_bind_client_id', get_bind_client_id(r.company_id),
        'company_bind_warehouse_id', get_bind_warehouse_id(r.company_id),
        'company_bind_location_id', COALESCE(
            get_bind_branch_id(r.project_id),
            c.bind_location_id
        ),
        'company_bind_price_list_id', c.bind_price_list_id,
        'company_bind_currency_id', c.bind_currency_id,
        'company_bind_address_id', c.bind_address_id,

        -- Información de la requisición
        'comments', COALESCE(
            'Requisición ComerECO #' || r.internal_folio ||
            CASE WHEN r.comments IS NOT NULL AND r.comments != ''
                 THEN ' - ' || r.comments
                 ELSE ''
            END,
            ''
        ),
        'total_amount', r.total_amount,
        'created_at', r.created_at,
        'approved_at', r.approved_at,

        -- Productos (formato para BIND API)
        'items', (
            SELECT jsonb_agg(jsonb_build_object(
                'product_bind_id', p.bind_id,
                'product_name', p.name,
                'product_sku', p.sku,
                'quantity', ri.quantity,
                'unit_price', ri.unit_price,
                'subtotal', ri.subtotal,
                'unit', p.unit,
                'vat', 0  -- IVA en 0 por defecto
            ) ORDER BY ri.created_at)
            FROM requisition_items ri
            JOIN products p ON ri.product_id = p.id
            WHERE ri.requisition_id = r.id
        )
    ) INTO payload
    FROM requisitions r
    JOIN companies c ON r.company_id = c.id
    WHERE r.id = requisition_id_param;

    RETURN payload;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.build_bind_payload IS
'Construye payload JSONB con IDs reales de BIND ERP para crear orden';

-- ============================================
-- PASO 4: Verificación de Configuración
-- ============================================

-- Verificar mappings creados
SELECT
    bm.mapping_type,
    bm.bind_id,
    bm.bind_data->>'client_name' as entity_name,
    bm.is_active,
    c.name as company_name
FROM bind_mappings bm
JOIN companies c ON bm.company_id = c.id
WHERE bm.is_active = true
ORDER BY bm.mapping_type;

-- Debería retornar:
-- | mapping_type | bind_id                              | entity_name                 | is_active | company_name            |
-- |--------------|--------------------------------------|------------------------------|-----------|-------------------------|
-- | client       | d02c1c47-c9a5-4728-93a0-29e6b6136a15 | Soluciones a la Orden       | true      | Soluciones a la Orden   |
-- | warehouse    | a8605382-7b48-47e2-9fb6-a25cfb7cf735 | Matriz                      | true      | Soluciones a la Orden   |
-- | location     | d7ef64f2-fd1e-437a-bd93-af01985be5a5 | Ubicación Principal         | true      | Soluciones a la Orden   |

-- Verificar configuración de empresa
SELECT
    c.name,
    c.bind_location_id,
    c.bind_price_list_id,
    c.bind_currency_id,
    c.bind_address_id,
    get_bind_client_id(c.id) as client_id_from_mapping,
    get_bind_warehouse_id(c.id) as warehouse_id_from_mapping
FROM companies c
WHERE c.name ILIKE '%soluciones%';

-- Debería retornar todos los campos llenos con UUIDs

-- ============================================
-- PASO 5: Test del Payload Completo
-- ============================================

-- Probar con una requisición real
-- REEMPLAZAR <requisition-id> con un ID real de tu DB
SELECT build_bind_payload('<requisition-id>');

-- Debería retornar algo como:
-- {
--   "requisition_id": "uuid",
--   "internal_folio": "REQ-2025-001",
--   "company_bind_client_id": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
--   "company_bind_warehouse_id": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
--   "company_bind_location_id": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
--   "company_bind_price_list_id": "1d5f1d2f-7cd1-4e44-83cc-d47789f70b51",
--   "company_bind_currency_id": "b7e2c065-bd52-40ca-b508-3accdd538860",
--   "company_bind_address_id": "efff1744-da2f-499d-952f-20b9140a95bf",
--   "comments": "Requisición ComerECO #REQ-2025-001 - Comentarios...",
--   "items": [...]
-- }

-- ============================================
-- PASO 6: Productos de Ejemplo (OPCIONAL)
-- ============================================

-- Si necesitas productos de prueba con bind_id real:
UPDATE products
SET bind_id = '2d800143-c834-497a-939c-a6e9d19f645f',  -- ✅ ProductID REAL
    name = 'Cloro Líquido',
    price = 9.50,
    unit = 'Litro',
    stock = 150
WHERE id = '<id-producto-en-tu-db>'
  OR name ILIKE '%cloro%'
LIMIT 1;

-- ============================================
-- PASO 7: Health Check Final
-- ============================================

DO $$
DECLARE
    missing_config TEXT[];
    company_record RECORD;
BEGIN
    -- Verificar configuración completa
    SELECT * INTO company_record
    FROM companies c
    WHERE c.name ILIKE '%soluciones%'
    LIMIT 1;

    IF company_record IS NULL THEN
        RAISE EXCEPTION '❌ ERROR: No se encontró empresa "Soluciones a la Orden"';
    END IF;

    -- Verificar campos requeridos
    missing_config := ARRAY[]::TEXT[];

    IF company_record.bind_location_id IS NULL THEN
        missing_config := array_append(missing_config, 'bind_location_id');
    END IF;

    IF company_record.bind_price_list_id IS NULL THEN
        missing_config := array_append(missing_config, 'bind_price_list_id');
    END IF;

    IF company_record.bind_currency_id IS NULL THEN
        missing_config := array_append(missing_config, 'bind_currency_id');
    END IF;

    IF company_record.bind_address_id IS NULL THEN
        missing_config := array_append(missing_config, 'bind_address_id');
    END IF;

    -- Verificar mappings
    IF NOT EXISTS (
        SELECT 1 FROM bind_mappings
        WHERE company_id = company_record.id
          AND mapping_type = 'client'
          AND is_active = true
    ) THEN
        missing_config := array_append(missing_config, 'client_mapping');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM bind_mappings
        WHERE company_id = company_record.id
          AND mapping_type = 'warehouse'
          AND is_active = true
    ) THEN
        missing_config := array_append(missing_config, 'warehouse_mapping');
    END IF;

    -- Resultado
    IF array_length(missing_config, 1) > 0 THEN
        RAISE WARNING '⚠️ Configuración incompleta. Faltan: %', array_to_string(missing_config, ', ');
    ELSE
        RAISE NOTICE '✅ Configuración BIND completa y lista para usar';
        RAISE NOTICE '📊 Empresa: %', company_record.name;
        RAISE NOTICE '🔑 ClientID: %', get_bind_client_id(company_record.id);
        RAISE NOTICE '📦 WarehouseID: %', get_bind_warehouse_id(company_record.id);
        RAISE NOTICE '📍 LocationID: %', company_record.bind_location_id;
    END IF;
END $$;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
✅ IDs VALIDADOS:
- ClientID: d02c1c47-c9a5-4728-93a0-29e6b6136a15 (Soluciones a la Orden)
- WarehouseID: a8605382-7b48-47e2-9fb6-a25cfb7cf735 (Matriz)
- LocationID: d7ef64f2-fd1e-437a-bd93-af01985be5a5
- PriceListID: 1d5f1d2f-7cd1-4e44-83cc-d47789f70b51
- CurrencyID: b7e2c065-bd52-40ca-b508-3accdd538860 (MXN)
- AddressID: efff1744-da2f-499d-952f-20b9140a95bf
- ProductID ejemplo: 2d800143-c834-497a-939c-a6e9d19f645f (Cloro, 9.5 MXN)

🔐 API TOKEN:
- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Expira: 2026-12-24
- Formato header: Authorization: Bearer {token}

📡 BASE URL:
- https://api.bind.com.mx/api/

⚠️ COMPORTAMIENTO DELETE:
- DELETE /Orders/{id} NO elimina físicamente
- Cambia StatusCode de 0 (Pendiente) a 2 (Cancelado)
- Orden sigue siendo accesible via GET
- Filtrar en reportes: StatusCode != 2
*/
