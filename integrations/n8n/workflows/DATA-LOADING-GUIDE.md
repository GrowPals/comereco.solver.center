# 📊 Guía de Carga de Datos Reales

**Propósito:** Orden correcto para subir datos reales al sistema

---

## 🔢 Orden de Carga (Dependencias)

```
1. ✅ auth.users (Usuario admin)       ← YA EXISTE
   ↓
2. ✅ profiles (Profile del admin)     ← YA EXISTE
   ↓
3. 🟦 companies (Tu empresa)           ← CARGAR PRIMERO
   ↓
4. 🟦 projects (Tus proyectos/obras)   ← CARGAR SEGUNDO
   ↓
5. 🟦 products (Tu catálogo)           ← CARGAR TERCERO
   ↓
6. 🟨 requisitions (Requisiciones)     ← Se crean desde la app
```

**Leyenda:**
- ✅ Ya existe (admin)
- 🟦 Datos maestros (cargar una vez)
- 🟨 Datos transaccionales (uso diario)

---

## 1️⃣ Companies (Empresas)

**¿Qué es?** Tu empresa (ComerECO)

**Campos obligatorios:**
```sql
INSERT INTO companies (
  name,                    -- Nombre de tu empresa
  legal_name,             -- Razón social
  tax_id,                 -- RFC
  bind_client_id,         -- ✅ ID de cliente en BIND
  bind_location_id,       -- ✅ ID de ubicación en BIND
  bind_price_list_id,     -- ✅ ID de lista de precios en BIND
  is_active
) VALUES (
  'ComerECO',
  'ComerECO S.A. de C.V.',
  'CECO850101ABC',
  'd02c1c47-c9a5-4728-93a0-29e6b6136a15',  -- Cliente en BIND
  'd7ef64f2-fd1e-437a-bd93-af01985be5a5',  -- Ubicación en BIND
  '1d5f1d2f-7cd1-4e44-83cc-d47789f70b51',  -- Lista precios en BIND
  true
);
```

**⚠️ IMPORTANTE:** Los `bind_*_id` deben ser IDs reales de BIND.

**¿Cómo obtenerlos?**
- Consulta BIND API:
  - `GET /api/Clients` → bind_client_id
  - `GET /api/Locations` → bind_location_id
  - `GET /api/PriceLists` → bind_price_list_id

---

## 2️⃣ Projects (Proyectos/Obras)

**¿Qué es?** Cada obra o proyecto de construcción

**Campos obligatorios:**
```sql
INSERT INTO projects (
  company_id,              -- ID de tu empresa (paso anterior)
  name,                    -- Nombre del proyecto
  code,                    -- Código/clave del proyecto
  location,               -- Ubicación física
  status,                 -- 'active', 'completed', 'on_hold'
  is_active
) VALUES (
  '<company_id>',
  'Residencial Las Palmas',
  'PROJ-001',
  'Av. Principal 123, Querétaro',
  'active',
  true
);
```

**Ejemplo con múltiples proyectos:**
```sql
INSERT INTO projects (company_id, name, code, location, status, is_active)
VALUES
  ('<company_id>', 'Residencial Las Palmas', 'PROJ-001', 'Querétaro', 'active', true),
  ('<company_id>', 'Torre Ejecutiva Centro', 'PROJ-002', 'CDMX', 'active', true),
  ('<company_id>', 'Plaza Comercial Sur', 'PROJ-003', 'Guadalajara', 'active', true);
```

---

## 3️⃣ Products (Productos/Catálogo)

**¿Qué es?** Tu catálogo de productos

**Campos obligatorios:**
```sql
INSERT INTO products (
  company_id,
  sku,
  name,
  description,
  price,
  stock,
  unit,
  bind_product_id,         -- ✅ ID del producto en BIND
  is_active
) VALUES (
  '<company_id>',
  'CEM-001',
  'Cemento Portland 50kg',
  'Cemento gris para construcción',
  180.00,
  500,
  'bulto',
  '30ef79f4-f1ed-4d58-be61-0366a6fe1d20',  -- ID en BIND
  true
);
```

**⚠️ CRÍTICO:** `bind_product_id` debe ser el ID real del producto en BIND.

**¿Cómo obtener bind_product_id?**
- Consulta BIND API: `GET /api/Products`
- Busca por SKU o nombre
- Usa el campo `ID` del producto

**Ejemplo con múltiples productos:**
```sql
INSERT INTO products (company_id, sku, name, price, stock, unit, bind_product_id, is_active)
VALUES
  ('<company_id>', 'CEM-001', 'Cemento Portland 50kg', 180.00, 500, 'bulto', '<bind-id-1>', true),
  ('<company_id>', 'VAR-001', 'Varilla 3/8" 12m', 85.00, 200, 'pza', '<bind-id-2>', true),
  ('<company_id>', 'BLO-001', 'Block hueco 15x20x40', 12.50, 1000, 'pza', '<bind-id-3>', true);
```

---

## 4️⃣ Requisitions (Requisiciones)

**¿Qué es?** Las solicitudes de material

**Estas se crean desde la aplicación web**, no necesitas subirlas manualmente.

**Flujo:**
1. Usuario crea requisición en app
2. Usuario aprueba requisición
3. Estado cambia a `approved` + `pending_sync`
4. Workflow WF-02 la sincroniza a BIND automáticamente

---

## 📝 Script de Carga Completo

```sql
-- ============================================
-- CARGAR DATOS REALES
-- ============================================

DO $$
DECLARE
  v_company_id UUID;
  v_project_1_id UUID;
  v_project_2_id UUID;
BEGIN

  -- ============================================
  -- 1. CREAR EMPRESA
  -- ============================================
  INSERT INTO companies (
    name,
    legal_name,
    tax_id,
    bind_client_id,
    bind_location_id,
    bind_price_list_id,
    is_active
  ) VALUES (
    'ComerECO',
    'ComerECO S.A. de C.V.',
    'CECO850101ABC',
    'd02c1c47-c9a5-4728-93a0-29e6b6136a15',  -- ⚠️ CAMBIAR por ID real
    'd7ef64f2-fd1e-437a-bd93-af01985be5a5',  -- ⚠️ CAMBIAR por ID real
    '1d5f1d2f-7cd1-4e44-83cc-d47789f70b51',  -- ⚠️ CAMBIAR por ID real
    true
  )
  RETURNING id INTO v_company_id;

  RAISE NOTICE '✅ Empresa creada: %', v_company_id;

  -- ============================================
  -- 2. CREAR PROYECTOS
  -- ============================================
  INSERT INTO projects (
    company_id,
    name,
    code,
    location,
    status,
    is_active
  ) VALUES (
    v_company_id,
    'Residencial Las Palmas',
    'PROJ-001',
    'Av. Principal 123, Querétaro',
    'active',
    true
  )
  RETURNING id INTO v_project_1_id;

  INSERT INTO projects (
    company_id,
    name,
    code,
    location,
    status,
    is_active
  ) VALUES (
    v_company_id,
    'Torre Ejecutiva Centro',
    'PROJ-002',
    'Reforma 500, CDMX',
    'active',
    true
  )
  RETURNING id INTO v_project_2_id;

  RAISE NOTICE '✅ Proyectos creados: %, %', v_project_1_id, v_project_2_id;

  -- ============================================
  -- 3. CREAR PRODUCTOS
  -- ============================================
  INSERT INTO products (
    company_id,
    sku,
    name,
    description,
    price,
    stock,
    unit,
    bind_product_id,
    is_active
  ) VALUES
  (
    v_company_id,
    'CEM-001',
    'Cemento Portland 50kg',
    'Cemento gris tipo I para construcción general',
    180.00,
    500,
    'bulto',
    '30ef79f4-f1ed-4d58-be61-0366a6fe1d20',  -- ⚠️ CAMBIAR por ID real
    true
  ),
  (
    v_company_id,
    'VAR-001',
    'Varilla corrugada 3/8" 12m',
    'Varilla de acero corrugado calibre 3/8"',
    85.00,
    200,
    'pza',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- ⚠️ CAMBIAR por ID real
    true
  ),
  (
    v_company_id,
    'BLO-001',
    'Block hueco 15x20x40cm',
    'Block de concreto hueco para muros',
    12.50,
    1000,
    'pza',
    'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',  -- ⚠️ CAMBIAR por ID real
    true
  );

  RAISE NOTICE '✅ 3 productos creados';

  -- ============================================
  -- RESUMEN
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DATOS MAESTROS CARGADOS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '🏢 Empresa: ComerECO';
  RAISE NOTICE '📁 Proyectos: 2';
  RAISE NOTICE '📦 Productos: 3';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 SIGUIENTE PASO:';
  RAISE NOTICE '   1. Verifica los datos en la app';
  RAISE NOTICE '   2. Crea una requisición de prueba';
  RAISE NOTICE '   3. Apruébala';
  RAISE NOTICE '   4. WF-02 la sincronizará automáticamente';
  RAISE NOTICE '';

END $$;

-- Verificar datos cargados
SELECT '🏢 EMPRESAS' as tipo, id, name, bind_client_id FROM companies;
SELECT '📁 PROYECTOS' as tipo, id, name, code, location FROM projects;
SELECT '📦 PRODUCTOS' as tipo, id, sku, name, price, bind_product_id FROM products;
```

---

## ✅ Checklist de Verificación

Antes de cargar datos reales, asegúrate de tener:

- [ ] **IDs de BIND obtenidos:**
  - [ ] bind_client_id (Cliente)
  - [ ] bind_location_id (Ubicación)
  - [ ] bind_price_list_id (Lista de precios)
  - [ ] bind_product_id de cada producto

- [ ] **Datos de empresa listos:**
  - [ ] Nombre
  - [ ] Razón social
  - [ ] RFC

- [ ] **Lista de proyectos/obras:**
  - [ ] Nombre de cada proyecto
  - [ ] Código único
  - [ ] Ubicación

- [ ] **Catálogo de productos:**
  - [ ] SKU único por producto
  - [ ] Nombre descriptivo
  - [ ] Precio
  - [ ] Unidad de medida
  - [ ] bind_product_id de BIND

---

## 🔍 Cómo Obtener IDs de BIND

### Opción 1: Via API

```bash
# Cliente
curl -X GET "$BIND_API_URL/api/Clients" \
  -H "Authorization: Bearer $BIND_TOKEN"

# Ubicaciones
curl -X GET "$BIND_API_URL/api/Locations" \
  -H "Authorization: Bearer $BIND_TOKEN"

# Listas de precios
curl -X GET "$BIND_API_URL/api/PriceLists" \
  -H "Authorization: Bearer $BIND_TOKEN"

# Productos
curl -X GET "$BIND_API_URL/api/Products" \
  -H "Authorization: Bearer $BIND_TOKEN"
```

### Opción 2: Via n8n

Crea un workflow temporal:
1. HTTP Request → GET a BIND API
2. Code → Extrae los IDs que necesitas
3. Guarda los resultados

---

## 🚨 Errores Comunes

### ❌ Error: "bind_product_id no existe en BIND"
**Causa:** El ID del producto es incorrecto
**Solución:** Verifica que sea un UUID real de un producto en BIND

### ❌ Error: "bind_client_id no existe"
**Causa:** El ID del cliente es incorrecto
**Solución:** Consulta `GET /api/Clients` en BIND para obtener el ID correcto

### ❌ Error: "duplicate key violates unique constraint"
**Causa:** Intentas insertar un SKU que ya existe
**Solución:** Cambia el SKU o actualiza el producto existente

---

## 📚 Archivos Relacionados

- [CLEANUP-ALL-EXCEPT-ADMIN.sql](./CLEANUP-ALL-EXCEPT-ADMIN.sql) - Limpiar datos de prueba primero
- [COMPLETE-TEST-SETUP.sql](./COMPLETE-TEST-SETUP.sql) - Ejemplo de carga con datos de prueba
- [WF-02-README.md](./WF-02-README.md) - Documentación del workflow de sincronización

---

**Última actualización:** 2025-11-05
**Estado:** ✅ Listo para carga de datos reales
