# 🚀 GUÍA DE IMPLEMENTACIÓN BIND ERP - PASO A PASO

**Fecha:** 2025-11-02
**Objetivo:** Activar integración automática con Bind ERP en 3-4 días

---

## 📋 PREREQUISITOS

Antes de empezar, asegúrate de tener:

- [ ] Acceso a Bind ERP API (URL y token de autenticación)
- [ ] IDs reales de Bind ERP:
  - [ ] ClientID de "Soluciones a la Orden" (ejemplo: `CLI-SOLUCIONES-001`)
  - [ ] BranchID de sucursales de ComerECO (ejemplo: `SUC-NORTE`)
  - [ ] WarehouseID de almacenes (ejemplo: `ALM-PRINCIPAL`)
- [ ] n8n instalado o acceso a instancia de n8n
- [ ] Acceso a Supabase con permisos de admin

---

## 🔴 DÍA 1: INFRAESTRUCTURA BASE (2-3 horas)

### PASO 1.1: Crear Trigger para Encolar Requisiciones (15 min)

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_trigger_enqueue_for_bind.sql`

```sql
-- ============================================================
-- MIGRATION: Crear trigger para encolar requisiciones en PGMQ
-- ============================================================

-- PASO 1: Crear el trigger
CREATE TRIGGER trigger_enqueue_for_bind
AFTER UPDATE ON public.requisitions
FOR EACH ROW
WHEN (
    NEW.integration_status = 'pending_sync'
    AND OLD.integration_status IS DISTINCT FROM 'pending_sync'
)
EXECUTE FUNCTION public.enqueue_requisition_for_bind();

-- PASO 2: Verificación
-- Ejecutar esto después de aplicar la migration para verificar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trigger_enqueue_for_bind'
    ) THEN
        RAISE NOTICE '✅ Trigger creado correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Trigger no fue creado';
    END IF;
END $$;
```

**Aplicar migration:**

```bash
# Desde la raíz del proyecto
cd supabase
supabase migration new create_trigger_enqueue_for_bind

# Copiar el código SQL de arriba al archivo generado

# Aplicar a Supabase
supabase db push
```

**Verificar:**

```sql
-- En Supabase SQL Editor
SELECT
    t.tgname as trigger_name,
    p.proname as function_name,
    t.tgenabled as enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.requisitions'::regclass
  AND t.tgname = 'trigger_enqueue_for_bind';

-- Debería retornar 1 fila con enabled = 'O' (Origin)
```

---

### PASO 1.2: Crear Tabla `bind_mappings` (30 min)

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_bind_mappings.sql`

```sql
-- ============================================================
-- MIGRATION: Crear tabla bind_mappings para mapear IDs
-- ============================================================

-- PASO 1: Crear la tabla
CREATE TABLE IF NOT EXISTS public.bind_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    mapping_type TEXT NOT NULL CHECK (mapping_type IN (
        'client',      -- Mapeo de company → ClientID de Bind
        'product',     -- Mapeo de product → ProductID de Bind
        'location',    -- Mapeo de ubicación → LocationID de Bind
        'warehouse',   -- Mapeo de almacén → WarehouseID de Bind
        'branch'       -- Mapeo de proyecto → BranchID de Bind
    )),
    supabase_id UUID,        -- ID en Supabase (puede ser NULL para mappings a nivel empresa)
    bind_id TEXT NOT NULL,   -- ID correspondiente en Bind ERP
    bind_data JSONB,         -- Datos adicionales de Bind (nombre, descripción, etc.)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint único: una entidad de Supabase solo puede tener un mapeo activo por tipo
    UNIQUE(company_id, mapping_type, supabase_id)
);

-- PASO 2: Crear índices para performance
CREATE INDEX idx_bind_mappings_company_type
    ON public.bind_mappings(company_id, mapping_type);

CREATE INDEX idx_bind_mappings_supabase_id
    ON public.bind_mappings(supabase_id)
    WHERE supabase_id IS NOT NULL;

CREATE INDEX idx_bind_mappings_bind_id
    ON public.bind_mappings(bind_id);

-- PASO 3: Habilitar RLS
ALTER TABLE public.bind_mappings ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas RLS
CREATE POLICY "Users can view bind mappings of their company"
    ON public.bind_mappings FOR SELECT
    USING (
        company_id = (
            SELECT company_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage bind mappings"
    ON public.bind_mappings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND company_id = bind_mappings.company_id
              AND role_v2 = 'admin'
        )
    );

-- PASO 5: Trigger para updated_at
CREATE TRIGGER set_updated_at_bind_mappings
    BEFORE UPDATE ON public.bind_mappings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- PASO 6: Verificación
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'bind_mappings'
    ) THEN
        RAISE NOTICE '✅ Tabla bind_mappings creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla bind_mappings no fue creada';
    END IF;
END $$;
```

**Aplicar migration:**

```bash
supabase migration new create_bind_mappings
# Copiar SQL de arriba
supabase db push
```

**Verificar:**

```sql
-- Verificar estructura
\d public.bind_mappings

-- Verificar RLS
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'bind_mappings';
```

---

### PASO 1.3: Insertar Mappings Iniciales (15 min)

**IMPORTANTE:** Reemplaza los valores de ejemplo con los IDs reales de Bind ERP.

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_seed_bind_mappings.sql`

```sql
-- ============================================================
-- MIGRATION: Seed initial bind_mappings
-- ============================================================

-- PASO 1: Mapear empresa "Soluciones a la Orden" → ClientID de Bind
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
    'CLI-SOLUCIONES-001',  -- ⚠️ REEMPLAZAR con ClientID real de Bind
    jsonb_build_object(
        'client_name', c.name,
        'mapped_at', NOW()
    ),
    true
FROM public.companies c
WHERE c.name = 'Soluciones a la Orden'  -- ⚠️ Verificar nombre exacto
ON CONFLICT (company_id, mapping_type, supabase_id) DO UPDATE
SET bind_id = EXCLUDED.bind_id,
    bind_data = EXCLUDED.bind_data,
    updated_at = NOW();

-- PASO 2: Mapear almacén por defecto (si aplica)
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
    'ALM-PRINCIPAL',  -- ⚠️ REEMPLAZAR con WarehouseID real de Bind
    jsonb_build_object(
        'warehouse_name', 'Almacén Principal',
        'mapped_at', NOW()
    ),
    true
FROM public.companies c
WHERE c.name = 'Soluciones a la Orden'
ON CONFLICT (company_id, mapping_type, supabase_id) DO UPDATE
SET bind_id = EXCLUDED.bind_id,
    bind_data = EXCLUDED.bind_data,
    updated_at = NOW();

-- PASO 3: Verificar mappings insertados
DO $$
DECLARE
    mapping_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mapping_count
    FROM public.bind_mappings
    WHERE is_active = true;

    IF mapping_count >= 2 THEN
        RAISE NOTICE '✅ Mappings iniciales creados: % registros', mapping_count;
    ELSE
        RAISE WARNING '⚠️ Solo se crearon % mappings (se esperaban al menos 2)', mapping_count;
    END IF;
END $$;

-- PASO 4: Ver mappings creados
SELECT
    mapping_type,
    bind_id,
    bind_data->>'client_name' as entity_name,
    is_active
FROM public.bind_mappings
WHERE is_active = true
ORDER BY mapping_type;
```

**Aplicar migration:**

```bash
# ANTES de aplicar, editar el archivo y reemplazar:
# - 'CLI-SOLUCIONES-001' con el ClientID real
# - 'ALM-PRINCIPAL' con el WarehouseID real
# - 'Soluciones a la Orden' con el nombre exacto de la empresa

supabase migration new seed_bind_mappings
# Copiar SQL de arriba (con valores reales)
supabase db push
```

---

### PASO 1.4: Crear Funciones Helper (30 min)

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_bind_helper_functions.sql`

```sql
-- ============================================================
-- MIGRATION: Crear funciones helper para integración con Bind
-- ============================================================

-- FUNCIÓN 1: Obtener ClientID de Bind para una empresa
CREATE OR REPLACE FUNCTION public.get_bind_client_id(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_client_id TEXT;
BEGIN
    SELECT bind_id INTO bind_client_id
    FROM public.bind_mappings
    WHERE company_id = company_id_param
      AND mapping_type = 'client'
      AND is_active = true
    LIMIT 1;

    RETURN bind_client_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_bind_client_id IS
'Retorna el ClientID de Bind ERP para una empresa de Supabase';

-- FUNCIÓN 2: Obtener ProductID de Bind para un producto
CREATE OR REPLACE FUNCTION public.get_bind_product_id(product_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_product_id TEXT;
BEGIN
    -- Primero intentar desde bind_mappings
    SELECT bind_id INTO bind_product_id
    FROM public.bind_mappings
    WHERE supabase_id = product_id_param
      AND mapping_type = 'product'
      AND is_active = true
    LIMIT 1;

    -- Si no existe en mappings, usar products.bind_id directamente
    IF bind_product_id IS NULL THEN
        SELECT bind_id INTO bind_product_id
        FROM public.products
        WHERE id = product_id_param;
    END IF;

    RETURN bind_product_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_bind_product_id IS
'Retorna el ProductID de Bind ERP para un producto de Supabase';

-- FUNCIÓN 3: Obtener BranchID de Bind para un proyecto
CREATE OR REPLACE FUNCTION public.get_bind_branch_id(project_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_branch_id TEXT;
    project_company_id UUID;
BEGIN
    -- Obtener company_id del proyecto
    SELECT company_id INTO project_company_id
    FROM public.projects
    WHERE id = project_id_param;

    IF project_company_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Intentar obtener desde bind_mappings (mapeo específico por proyecto)
    SELECT bind_id INTO bind_branch_id
    FROM public.bind_mappings
    WHERE company_id = project_company_id
      AND mapping_type = 'branch'
      AND supabase_id = project_id_param
      AND is_active = true
    LIMIT 1;

    -- Si no existe mapping específico, usar companies.bind_location_id
    IF bind_branch_id IS NULL THEN
        SELECT bind_location_id INTO bind_branch_id
        FROM public.companies
        WHERE id = project_company_id;
    END IF;

    RETURN bind_branch_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_bind_branch_id IS
'Retorna el BranchID de Bind ERP para un proyecto de Supabase';

-- FUNCIÓN 4: Obtener WarehouseID de Bind para una empresa
CREATE OR REPLACE FUNCTION public.get_bind_warehouse_id(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    bind_warehouse_id TEXT;
BEGIN
    SELECT bind_id INTO bind_warehouse_id
    FROM public.bind_mappings
    WHERE company_id = company_id_param
      AND mapping_type = 'warehouse'
      AND is_active = true
    LIMIT 1;

    RETURN bind_warehouse_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_bind_warehouse_id IS
'Retorna el WarehouseID de Bind ERP para una empresa de Supabase';

-- VERIFICACIÓN
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'get_bind_%';

    IF func_count >= 4 THEN
        RAISE NOTICE '✅ Funciones helper creadas correctamente: % funciones', func_count;
    ELSE
        RAISE WARNING '⚠️ Solo se crearon % funciones (se esperaban 4)', func_count;
    END IF;
END $$;
```

**Aplicar migration:**

```bash
supabase migration new create_bind_helper_functions
# Copiar SQL de arriba
supabase db push
```

**Verificar:**

```sql
-- Probar las funciones con datos reales
SELECT
    get_bind_client_id(c.id) as client_id,
    get_bind_warehouse_id(c.id) as warehouse_id
FROM companies c
WHERE c.name = 'Soluciones a la Orden';

-- Debería retornar:
-- client_id: CLI-SOLUCIONES-001
-- warehouse_id: ALM-PRINCIPAL
```

---

### ✅ CHECKPOINT DÍA 1

Al final del día 1, deberías tener:

- [x] Trigger `trigger_enqueue_for_bind` activo
- [x] Tabla `bind_mappings` creada con RLS
- [x] Mappings iniciales insertados (ClientID, WarehouseID)
- [x] 4 funciones helper funcionando

**Prueba end-to-end del día 1:**

```sql
-- 1. Aprobar una requisición de prueba
UPDATE requisitions
SET integration_status = 'pending_sync'
WHERE id = 'tu-requisition-id-de-prueba';

-- 2. Verificar que el mensaje llegó a PGMQ
SELECT *
FROM pgmq.read('requisition_outbox_queue', 10, 10);

-- Deberías ver un mensaje JSONB con:
-- - requisition_id
-- - company_bind_location_id
-- - items con product_bind_id
```

---

## 🔴 DÍA 2-3: WORKFLOW N8N (1-2 días)

### PASO 2.1: Instalar n8n (si no está instalado)

**Opción A: Docker (Recomendado)**

```bash
# Crear docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=tu-password-seguro
      - GENERIC_TIMEZONE=America/Mexico_City
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:

# Iniciar
docker-compose up -d
```

**Acceso:** http://localhost:5678

---

### PASO 2.2: Configurar Conexión a Supabase en n8n

1. **Ir a:** Credentials → New → Postgres
2. **Configurar:**
   - Host: `db.azjaehrdzdfgrumbqmuc.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: `[tu-password-de-supabase]`
   - Port: `5432`
   - SSL: `allow`

3. **Probar conexión**

---

### PASO 2.3: Crear Workflow "bind-create-order"

**Archivo:** `n8n-workflows/bind-create-order.json` (exportar después de crear)

**Paso a paso en n8n UI:**

#### NODO 1: Schedule Trigger

```
Type: Schedule Trigger
Cron Expression: */30 * * * * *  (cada 30 segundos)
```

#### NODO 2: Postgres - Read PGMQ Queue

```
Operation: Execute Query
Query:
SELECT *
FROM pgmq.read('requisition_outbox_queue', 300, 10);
```

**Output esperado:**
```json
[
  {
    "msg_id": 123,
    "read_ct": 1,
    "enqueued_at": "2025-11-02T10:30:00Z",
    "vt": "2025-11-02T10:35:00Z",
    "message": {
      "requisition_id": "uuid-123",
      "company_bind_location_id": "...",
      "items": [...]
    }
  }
]
```

#### NODO 3: IF - Has Messages?

```
Condition: {{ $json.length > 0 }}
```

**True Branch → continuar**
**False Branch → END (sin mensajes)**

#### NODO 4: Loop Over Messages (Split In Batches)

```
Batch Size: 1
```

#### NODO 5: Set Variables

```javascript
// Extraer datos del mensaje
const message = $json.message;

return {
  msg_id: $json.msg_id,
  requisition_id: message.requisition_id,
  company_bind_location_id: message.company_bind_location_id,
  company_bind_price_list_id: message.company_bind_price_list_id,
  internal_folio: message.internal_folio,
  comments: message.comments,
  items: message.items
};
```

#### NODO 6: Postgres - Get Bind ClientID

```
Operation: Execute Query
Query:
SELECT
  get_bind_client_id(r.company_id) as client_id,
  get_bind_warehouse_id(r.company_id) as warehouse_id,
  r.company_id
FROM requisitions r
WHERE r.id = '{{ $json.requisition_id }}'::UUID;
```

#### NODO 7: Function - Build Bind Payload

```javascript
// Construir payload para API de Bind
const clientId = $('Postgres - Get Bind ClientID').first().json.client_id;
const warehouseId = $('Postgres - Get Bind ClientID').first().json.warehouse_id;
const items = $json.items;

// Mapear items al formato de Bind
const bindItems = items.map(item => ({
  ProductID: item.product_bind_id,
  Quantity: item.quantity,
  UnitPrice: parseFloat(item.unit_price)
}));

return {
  ClientID: clientId,
  BranchID: $json.company_bind_location_id,
  WarehouseID: warehouseId,
  Items: bindItems,
  Comment: `Requisición ComerECO #${$json.internal_folio} - ${$json.comments || ''}`,
  RequestDate: new Date().toISOString()
};
```

#### NODO 8: HTTP Request - Call Bind API

```
Method: POST
URL: {{ $env.BIND_API_URL }}/api/purchase-orders
Authentication: Bearer Token
Token: {{ $env.BIND_API_TOKEN }}
Headers:
  Content-Type: application/json
Body:
{{ $json }}
```

**⚠️ IMPORTANTE:** Configurar variables de entorno en n8n:
- Settings → Environment → Variables
- `BIND_API_URL`: `https://api.bind-erp.com` (URL real)
- `BIND_API_TOKEN`: `tu-token-real-de-bind`

#### NODO 9: IF - Bind API Success?

```
Condition: {{ $statusCode === 200 || $statusCode === 201 }}
```

**TRUE Branch (Success):**

##### NODO 10: Postgres - Update Requisition Success

```sql
UPDATE requisitions
SET
  integration_status = 'synced',
  bind_order_id = '{{ $json.folio }}',
  bind_synced_at = NOW()
WHERE id = '{{ $('Set Variables').first().json.requisition_id }}'::UUID;
```

##### NODO 11: Postgres - Delete Message from Queue

```sql
SELECT pgmq.delete('requisition_outbox_queue', {{ $('Set Variables').first().json.msg_id }});
```

##### NODO 12: Postgres - Create Notification

```sql
INSERT INTO notifications (user_id, company_id, type, title, message, link)
SELECT
  r.created_by,
  r.company_id,
  'success',
  'Pedido creado en Bind ERP',
  'Tu requisición ' || r.internal_folio || ' fue procesada. Folio Bind: {{ $('HTTP Request - Call Bind API').first().json.folio }}',
  '/requisitions/' || r.id
FROM requisitions r
WHERE r.id = '{{ $('Set Variables').first().json.requisition_id }}'::UUID;
```

**FALSE Branch (Failure):**

##### NODO 13: Postgres - Update Requisition Failed

```sql
UPDATE requisitions
SET
  integration_status = 'rejected',
  bind_rejection_reason = '{{ $json.error || "Error al crear pedido en Bind ERP" }}'
WHERE id = '{{ $('Set Variables').first().json.requisition_id }}'::UUID;
```

##### NODO 14: Postgres - Delete Message from Queue

```sql
SELECT pgmq.delete('requisition_outbox_queue', {{ $('Set Variables').first().json.msg_id }});
```

##### NODO 15: Postgres - Create Error Notification

```sql
INSERT INTO notifications (user_id, company_id, type, title, message, link)
SELECT
  (SELECT id FROM profiles WHERE role_v2 = 'admin' AND company_id = r.company_id LIMIT 1),
  r.company_id,
  'danger',
  'Error en integración Bind',
  'La requisición ' || r.internal_folio || ' no pudo ser procesada en Bind ERP',
  '/admin/bind-integration'
FROM requisitions r
WHERE r.id = '{{ $('Set Variables').first().json.requisition_id }}'::UUID;
```

---

### PASO 2.4: Guardar y Activar Workflow

1. **Guardar** el workflow con nombre: `bind-create-order`
2. **Activar** (toggle switch en la esquina superior derecha)
3. **Verificar ejecuciones:** Executions tab

---

### ✅ CHECKPOINT DÍA 2-3

Al final, deberías tener:

- [x] n8n instalado y corriendo
- [x] Conexión a Supabase PostgreSQL configurada
- [x] Workflow `bind-create-order` creado y activo
- [x] Variables de entorno configuradas (BIND_API_URL, BIND_API_TOKEN)

**Prueba end-to-end completa:**

```sql
-- 1. Aprobar una requisición
UPDATE requisitions
SET business_status = 'approved', integration_status = 'pending_sync'
WHERE id = 'tu-requisition-id';

-- 2. Esperar 30 segundos (el cron de n8n)

-- 3. Verificar que el estado cambió a 'synced'
SELECT
  id,
  internal_folio,
  integration_status,
  bind_order_id,
  bind_synced_at
FROM requisitions
WHERE id = 'tu-requisition-id';

-- Esperado:
-- integration_status: 'synced'
-- bind_order_id: 'PO-2025-XXXX' (folio de Bind)
-- bind_synced_at: timestamp reciente
```

---

## 🔴 DÍA 4: SINCRONIZACIÓN DE PRODUCTOS (opcional pero importante)

### PASO 3.1: Crear RPC `upsert_product_from_bind()`

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_create_upsert_product_from_bind.sql`

```sql
-- ============================================================
-- MIGRATION: Crear función para sincronizar productos desde Bind
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_product_from_bind(
    p_company_id UUID,
    p_product_data JSONB
)
RETURNS UUID AS $$
DECLARE
    product_id UUID;
    bind_id_val TEXT;
BEGIN
    bind_id_val := p_product_data->>'bind_id';

    IF bind_id_val IS NULL THEN
        RAISE EXCEPTION 'bind_id is required in product_data';
    END IF;

    -- Buscar producto existente por bind_id
    SELECT id INTO product_id
    FROM public.products
    WHERE company_id = p_company_id
      AND bind_id = bind_id_val;

    IF product_id IS NOT NULL THEN
        -- Actualizar producto existente
        UPDATE public.products
        SET
            name = p_product_data->>'name',
            description = COALESCE(p_product_data->>'description', ''),
            price = (p_product_data->>'price')::NUMERIC,
            stock = COALESCE((p_product_data->>'stock')::INT, 0),
            category = COALESCE(p_product_data->>'category', 'Sin categoría'),
            sku = COALESCE(p_product_data->>'sku', bind_id_val),
            unit = COALESCE(p_product_data->>'unit', 'unidad'),
            is_active = COALESCE((p_product_data->>'is_active')::BOOLEAN, true),
            bind_last_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = product_id;
    ELSE
        -- Crear nuevo producto
        INSERT INTO public.products (
            company_id,
            name,
            description,
            price,
            stock,
            bind_id,
            category,
            sku,
            unit,
            is_active,
            bind_last_synced_at
        ) VALUES (
            p_company_id,
            p_product_data->>'name',
            COALESCE(p_product_data->>'description', ''),
            (p_product_data->>'price')::NUMERIC,
            COALESCE((p_product_data->>'stock')::INT, 0),
            bind_id_val,
            COALESCE(p_product_data->>'category', 'Sin categoría'),
            COALESCE(p_product_data->>'sku', bind_id_val),
            COALESCE(p_product_data->>'unit', 'unidad'),
            COALESCE((p_product_data->>'is_active')::BOOLEAN, true),
            NOW()
        )
        RETURNING id INTO product_id;
    END IF;

    RETURN product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.upsert_product_from_bind IS
'Crea o actualiza un producto desde datos de Bind ERP';
```

**Aplicar:**

```bash
supabase migration new create_upsert_product_from_bind
# Copiar SQL
supabase db push
```

---

### PASO 3.2: Crear Workflow "bind-sync-products" en n8n

**Estructura del workflow:**

#### NODO 1: Cron Trigger

```
Cron: 0 2 * * *  (2 AM diario)
```

#### NODO 2: Postgres - Get Companies

```sql
SELECT id, bind_location_id, bind_price_list_id
FROM companies
WHERE active = true;
```

#### NODO 3: Loop Over Companies

#### NODO 4: HTTP Request - Get Products from Bind

```
Method: GET
URL: {{ $env.BIND_API_URL }}/api/products
Query Parameters:
  - location_id: {{ $json.bind_location_id }}
  - price_list_id: {{ $json.bind_price_list_id }}
  - active: true
```

#### NODO 5: Loop Over Products

#### NODO 6: Postgres - Upsert Product

```sql
SELECT upsert_product_from_bind(
  '{{ $('Get Companies').first().json.id }}'::UUID,
  '{{ JSON.stringify($json) }}'::JSONB
);
```

#### NODO 7: Postgres - Mark Deleted Products

```sql
UPDATE products
SET is_active = false
WHERE company_id = '{{ $('Get Companies').first().json.id }}'::UUID
  AND bind_id IS NOT NULL
  AND bind_last_synced_at < CURRENT_DATE;
```

---

## ✅ VERIFICACIÓN FINAL

### Test Completo End-to-End

```sql
-- PASO 1: Crear una requisición de prueba
SELECT create_full_requisition(
  'Prueba de integración Bind',
  '[{"product_id": "tu-product-id", "quantity": 2}]'::JSONB
) AS requisition_id;

-- PASO 2: Enviar para aprobación
SELECT submit_requisition('requisition-id-del-paso-1');

-- PASO 3: Aprobar
SELECT approve_requisition('requisition-id-del-paso-1', 'Aprobado para prueba');

-- PASO 4: Esperar 30 segundos (n8n ejecuta)

-- PASO 5: Verificar resultado
SELECT
  internal_folio,
  business_status,
  integration_status,
  bind_order_id,
  bind_synced_at,
  bind_rejection_reason
FROM requisitions
WHERE id = 'requisition-id-del-paso-1';

-- Esperado:
-- business_status: 'approved'
-- integration_status: 'synced'
-- bind_order_id: 'PO-2025-XXXX'
-- bind_synced_at: timestamp reciente
-- bind_rejection_reason: NULL
```

---

## 🎉 COMPLETADO

Si llegaste aquí, la integración con Bind ERP está **100% funcional**.

**Lo que ahora funciona automáticamente:**

1. ✅ Trabajador crea requisición en app
2. ✅ Supervisor aprueba con 1 click
3. ✅ **Sistema automáticamente:**
   - Encola requisición en PGMQ ✅
   - n8n detecta mensaje en < 30 segundos ✅
   - Mapea datos a formato Bind ✅
   - Llama API de Bind para crear pedido ✅
   - Guarda folio de Bind en Supabase ✅
   - Notifica al trabajador ✅
4. ✅ Material en camino desde ComerECO

**Sin intervención manual. Sin captura en Bind. Todo automático.**

---

## 📞 SOPORTE

Si encuentras errores:

1. **Revisar logs de n8n:** Executions tab
2. **Revisar cola PGMQ:**
   ```sql
   SELECT * FROM pgmq.read('requisition_outbox_queue', 10, 100);
   ```
3. **Revisar estado de requisiciones:**
   ```sql
   SELECT
     internal_folio,
     integration_status,
     bind_rejection_reason
   FROM requisitions
   WHERE integration_status IN ('pending_sync', 'syncing', 'rejected')
   ORDER BY updated_at DESC;
   ```

---

**Guía creada:** 2025-11-02
**Tiempo estimado total:** 3-4 días
**Próxima revisión:** Después de completar implementación
