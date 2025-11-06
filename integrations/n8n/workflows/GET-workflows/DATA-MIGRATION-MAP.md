# 🗺️ MAPA DE MIGRACIÓN DE DATOS: BIND ERP → SUPABASE

**Fecha:** 2025-11-06
**Objetivo:** Migrar datos desde BindERP a Supabase para poblar catálogos y configuraciones iniciales

---

## 📋 RESUMEN EJECUTIVO

Este documento define el mapeo entre los endpoints GET de BindERP y las tablas de Supabase, identificando:
- Qué datos obtener de BindERP
- En qué tabla de Supabase se guardan
- Qué transformaciones son necesarias
- Campos obligatorios vs opcionales

---

## 🎯 ESTRATEGIA DE MIGRACIÓN

### Fase 1: Configuración Inicial (Mappings)
1. **Almacenes** (Warehouses) → `bind_mappings`
2. **Ubicaciones** (Locations) → `bind_mappings` y `companies`
3. **Clientes** (Clients) → `bind_mappings`

### Fase 2: Catálogo de Productos
4. **Productos** (Products) → `products`
5. **Inventario** (Inventory) → actualizar `products.stock`

### Fase 3: Datos Complementarios (Opcional)
6. **Empleados** (Employees) → referencia para futuros desarrollos
7. **Listas de Precios** (PriceLists) → referencia

---

## 📊 MAPEO DETALLADO POR ENDPOINT

### 1️⃣ GET /Warehouses → `bind_mappings`

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Warehouses
```

**Respuesta BindERP:**
```json
{
  "value": [
    {
      "ID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
      "Name": "Matriz",
      "LocationID": "d7ef64f2-fd1e-437a-bd93-af01985be5a5",
      "IsActive": true
    }
  ]
}
```

**Tabla Destino:** `bind_mappings`

| Campo BindERP | Campo Supabase | Transformación | Obligatorio |
|---------------|----------------|----------------|-------------|
| `ID` | `bind_id` | Directo | ✅ |
| `Name` | `bind_data.name` | JSON | ✅ |
| `LocationID` | `bind_data.location_id` | JSON | ✅ |
| `IsActive` | `is_active` | Directo | ✅ |
| - | `mapping_type` | Hardcode: `"warehouse"` | ✅ |
| - | `company_id` | Contexto usuario | ✅ |
| - | `supabase_id` | `NULL` | ❌ |

**Workflow de 3 Nodos:**
```
1. GET /Warehouses
2. Transformar a formato bind_mappings (agregar mapping_type, company_id)
3. Convertir a TSV para carga manual
```

**TSV Output Headers:**
```tsv
company_id	mapping_type	supabase_id	bind_id	bind_data	is_active	created_at	updated_at
```

**Ejemplo TSV:**
```tsv
<company_uuid>	warehouse	\N	a8605382-7b48-47e2-9fb6-a25cfb7cf735	{"name":"Matriz","location_id":"d7ef64f2-fd1e-437a-bd93-af01985be5a5"}	true	2025-11-06 10:00:00	2025-11-06 10:00:00
```

---

### 2️⃣ GET /Locations → `bind_mappings` + `companies`

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Locations
```

**Tabla Destino 1:** `bind_mappings`

| Campo BindERP | Campo Supabase | Transformación | Obligatorio |
|---------------|----------------|----------------|-------------|
| `ID` | `bind_id` | Directo | ✅ |
| `Name` | `bind_data.name` | JSON | ✅ |
| - | `mapping_type` | Hardcode: `"location"` | ✅ |
| - | `company_id` | Contexto usuario | ✅ |

**Tabla Destino 2:** `companies`

| Campo BindERP | Campo Supabase | Transformación | Obligatorio |
|---------------|----------------|----------------|-------------|
| `ID` | `bind_location_id` | Directo | ✅ |
| - | `name` | Ya existe | ✅ |

**Workflow de 3 Nodos:**
```
1. GET /Locations
2. Transformar a formato bind_mappings
3. Convertir a TSV (solo bind_mappings, companies se actualiza manualmente)
```

---

### 3️⃣ GET /Clients → `bind_mappings`

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Clients
```

**Respuesta BindERP:**
```json
{
  "value": [
    {
      "ID": "d02c1c47-c9a5-4728-93a0-29e6b6136a15",
      "Number": "CLI-001",
      "Name": "Soluciones a la Orden",
      "ClientName": "Soluciones a la Orden S.A. de C.V.",
      "RFC": "SOL123456ABC",
      "Email": "contacto@soluciones.com",
      "IsActive": true
    }
  ]
}
```

**Tabla Destino:** `bind_mappings`

| Campo BindERP | Campo Supabase | Transformación | Obligatorio |
|---------------|----------------|----------------|-------------|
| `ID` | `bind_id` | Directo | ✅ |
| `Name` | `bind_data.name` | JSON | ✅ |
| `ClientName` | `bind_data.client_name` | JSON | ✅ |
| `RFC` | `bind_data.rfc` | JSON | ❌ |
| `Email` | `bind_data.email` | JSON | ❌ |
| `Number` | `bind_data.number` | JSON | ❌ |
| `IsActive` | `is_active` | Directo | ✅ |
| - | `mapping_type` | Hardcode: `"client"` | ✅ |
| - | `company_id` | Contexto usuario | ✅ |

**Workflow de 3 Nodos:**
```
1. GET /Clients
2. Transformar a formato bind_mappings
3. Convertir a TSV
```

**TSV Output Headers:**
```tsv
company_id	mapping_type	supabase_id	bind_id	bind_data	is_active	created_at	updated_at
```

---

### 4️⃣ GET /Products → `products` ⭐ PRINCIPAL

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Products?$top=1000&$skip=0
```

**Respuesta BindERP:**
```json
{
  "value": [
    {
      "ID": "79b0b9d5-57b6-4dc4-a152-002c27f5f7b2",
      "Code": "PROD-001",
      "Title": "Cloro Líquido",
      "Description": "Desinfectante multiusos",
      "Cost": 9.5,
      "CurrentInventory": 150,
      "Unit": "Litro",
      "Category1ID": "uuid",
      "Category2ID": "uuid",
      "Category3ID": "uuid",
      "ChargeVAT": true,
      "Type": 1,
      "TypeText": "Producto",
      "CurrencyCode": "MXN",
      "CreationDate": "2024-01-15T10:30:00Z",
      "Number": "1001",
      "SKU": "SKU-001"
    }
  ]
}
```

**Tabla Destino:** `products`

**Esquema Supabase `products`:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  bind_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0 CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  unit TEXT,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  bind_last_synced_at TIMESTAMPTZ,
  bind_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**MAPEO DETALLADO:**

| Campo BindERP | Campo Supabase | Transformación | Obligatorio | Notas |
|---------------|----------------|----------------|-------------|-------|
| `ID` | `bind_id` | Directo | ✅ | UUID de BindERP |
| `Code` | `sku` | Directo | ✅ | Código del producto |
| `Title` | `name` | Directo | ✅ | Nombre del producto |
| `Description` | `description` | Directo o `NULL` | ❌ | Puede estar vacío |
| `Cost` | `price` | Directo | ✅ | Precio base |
| `CurrentInventory` | `stock` | Directo | ✅ | Stock disponible |
| `Unit` | `unit` | Directo | ❌ | Ej: "Litro", "Pieza", "Kg" |
| `TypeText` o `Category1ID` | `category` | Transformar | ❌ | Usar TypeText o mapear categorías |
| - | `image_url` | `NULL` | ❌ | No viene de BindERP, agregar manualmente después |
| `IsActive` (inferir) | `is_active` | `CurrentInventory > 0` | ✅ | Si tiene stock, está activo |
| - | `bind_last_synced_at` | `now()` | ✅ | Timestamp de sincronización |
| - | `bind_sync_enabled` | `true` | ✅ | Habilitar sync automático |
| - | `company_id` | Contexto usuario | ✅ | UUID de la company |
| - | `created_at` | `now()` | ✅ | Timestamp de creación |
| - | `updated_at` | `now()` | ✅ | Timestamp de actualización |

**⚠️ DIFERENCIAS CRÍTICAS:**

1. **Campo `sku`:**
   - BindERP: `Code` (puede ser código interno)
   - Supabase: `sku` (NOT NULL)
   - **Solución:** Usar `Code` si existe, sino usar `ID`

2. **Campo `category`:**
   - BindERP: `Category1ID`, `Category2ID`, `Category3ID` (UUIDs)
   - Supabase: `category` (TEXT)
   - **Solución:** Necesitamos hacer un GET adicional para obtener nombres de categorías, o usar `TypeText` temporalmente

3. **Campo `price`:**
   - BindERP: `Cost` (puede ser 0)
   - Supabase: `price` (NOT NULL, CHECK >= 0)
   - **Solución:** Validar que no sea negativo

4. **Campo `is_active`:**
   - BindERP: No tiene campo explícito
   - Supabase: `is_active` (BOOLEAN)
   - **Solución:** Inferir de `CurrentInventory > 0`

**Workflow de 3 Nodos:**
```
1. GET /Products (con paginación si hay más de 1000)
2. Transformar:
   - Extraer campos
   - Agregar company_id
   - Agregar timestamps
   - Validar campos obligatorios
   - Manejar campos faltantes (SKU, category)
3. Convertir a TSV
```

**TSV Output Headers:**
```tsv
company_id	bind_id	sku	name	description	price	stock	unit	category	image_url	is_active	bind_last_synced_at	bind_sync_enabled	created_at	updated_at
```

**Ejemplo TSV:**
```tsv
<company_uuid>	79b0b9d5-57b6-4dc4-a152-002c27f5f7b2	PROD-001	Cloro Líquido	Desinfectante multiusos	9.5	150	Litro	Producto	\N	true	2025-11-06 10:00:00	true	2025-11-06 10:00:00	2025-11-06 10:00:00
```

---

### 5️⃣ GET /Inventory → Actualizar `products.stock`

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Inventory?warehouseId=a8605382-7b48-47e2-9fb6-a25cfb7cf735
```

**Respuesta BindERP:**
```json
{
  "value": [
    {
      "ProductID": "79b0b9d5-57b6-4dc4-a152-002c27f5f7b2",
      "ProductName": "Cloro Líquido",
      "WarehouseID": "a8605382-7b48-47e2-9fb6-a25cfb7cf735",
      "Quantity": 150,
      "MinStock": 20,
      "MaxStock": 500
    }
  ]
}
```

**Tabla Destino:** `products` (actualización de stock)

| Campo BindERP | Campo Supabase | Transformación | Obligatorio |
|---------------|----------------|----------------|-------------|
| `ProductID` | Match con `bind_id` | Buscar producto | ✅ |
| `Quantity` | `stock` | Actualizar | ✅ |
| - | `updated_at` | `now()` | ✅ |
| - | `bind_last_synced_at` | `now()` | ✅ |

**⚠️ NOTA:** Este endpoint es opcional si ya usamos `CurrentInventory` de `/Products`.

**Uso:** Sincronización periódica de stock (webhook o cron job).

---

### 6️⃣ GET /Employees → Referencia (NO MIGRAR AHORA)

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/Employees
```

**Tabla Destino:** `profiles` (futuro)

**Notas:**
- NO hay mapeo directo profiles ↔ employees de BindERP
- Los usuarios de Supabase son independientes
- Guardar en `bind_mappings` para referencia futura si es necesario

---

### 7️⃣ GET /PriceLists → Referencia (NO MIGRAR AHORA)

**Endpoint BindERP:**
```
GET https://api.bind.com.mx/api/PriceLists/{id}
```

**Uso:**
- Validar que el `PriceListID` configurado existe
- Obtener metadatos de lista de precios
- No se guarda en Supabase por ahora

---

## 🔄 ORDEN DE EJECUCIÓN DE WORKFLOWS

### Orden Recomendado:

```
1. GET Warehouses → bind_mappings
   └─ Resultado: WarehouseID mapeado

2. GET Locations → bind_mappings + companies
   └─ Resultado: LocationID mapeado y company actualizada

3. GET Clients → bind_mappings
   └─ Resultado: ClientID mapeado

4. GET Products → products
   └─ Resultado: Catálogo de productos poblado
   └─ Dependencia: company_id debe existir

5. [OPCIONAL] GET Inventory → actualizar products.stock
   └─ Resultado: Stock actualizado en tiempo real
```

---

## 📝 CAMPOS OBLIGATORIOS POR TABLA

### `bind_mappings`:
- ✅ `company_id` (UUID)
- ✅ `mapping_type` (TEXT)
- ✅ `bind_id` (TEXT)
- ❌ `supabase_id` (UUID) - Puede ser NULL
- ❌ `bind_data` (JSONB) - Puede ser NULL
- ❌ `is_active` (BOOLEAN) - Default: true

### `products`:
- ✅ `company_id` (UUID)
- ✅ `bind_id` (TEXT)
- ✅ `sku` (TEXT)
- ✅ `name` (TEXT)
- ✅ `price` (NUMERIC) - Default: 0
- ✅ `stock` (INTEGER) - Default: 0
- ❌ `description` (TEXT)
- ❌ `unit` (TEXT)
- ❌ `category` (TEXT)
- ❌ `image_url` (TEXT)
- ❌ `is_active` (BOOLEAN) - Default: true

### `companies`:
- ✅ `name` (TEXT) - Ya existe
- ❌ `bind_location_id` (TEXT) - Actualizar después de GET /Locations
- ❌ `bind_price_list_id` (TEXT) - Opcional

---

## ⚠️ PROBLEMAS IDENTIFICADOS Y SOLUCIONES

### Problema 1: Campo `category` en `products`
**Descripción:** BindERP devuelve `Category1ID`, `Category2ID`, `Category3ID` (UUIDs), pero Supabase espera `category` (TEXT).

**Soluciones:**
1. **Opción A (Rápida):** Usar `TypeText` como categoría temporal
   ```javascript
   category = product.TypeText || 'Sin categoría'
   ```

2. **Opción B (Completa):** Hacer GET adicional para obtener nombres
   ```javascript
   // Requiere endpoint GET /Categories (verificar si existe)
   // Si no existe, usar Opción A
   ```

3. **Opción C (Recomendada):** Guardar IDs en JSONB temporal
   ```javascript
   category = product.TypeText
   // Y guardar en bind_data adicional:
   bind_data = {
     category_1_id: product.Category1ID,
     category_2_id: product.Category2ID,
     category_3_id: product.Category3ID
   }
   ```

**Decisión:** Usar **Opción A** por ahora.

---

### Problema 2: Campo `sku` puede estar vacío
**Descripción:** `Code` puede estar vacío en algunos productos.

**Solución:**
```javascript
sku = product.Code || product.SKU || product.ID
```

---

### Problema 3: Campo `image_url` no existe en BindERP
**Descripción:** BindERP no devuelve imágenes de productos.

**Solución:**
- Dejar como `NULL` en TSV
- Agregar imágenes manualmente después
- O implementar upload de imágenes en futuro workflow

---

### Problema 4: Paginación en `/Products`
**Descripción:** El endpoint tiene límite de 1000 productos por request.

**Solución:**
```javascript
// En el nodo GET, hacer loop con $skip:
GET /Products?$top=1000&$skip=0
GET /Products?$top=1000&$skip=1000
GET /Products?$top=1000&$skip=2000
// Hasta que value.length < 1000
```

---

## 📦 ESTRUCTURA DE ARCHIVOS GENERADOS

```
integrations/n8n/workflows/GET-workflows/
├── DATA-MIGRATION-MAP.md (este archivo)
├── WF-GET-01-Warehouses.json
├── WF-GET-02-Locations.json
├── WF-GET-03-Clients.json
├── WF-GET-04-Products.json
└── WF-GET-05-Inventory.json
```

Cada workflow seguirá el patrón de 3 nodos:
```
[GET BindERP] → [Transform] → [TSV Export]
```

---

## 🎯 SIGUIENTE PASO

Crear el primer workflow:
```bash
WF-GET-04-Products.json
```

Este es el más importante porque popula el catálogo de productos.

---

**Generado:** 2025-11-06
**Por:** Claude Code Agent
**Basado en:** Análisis de esquemas de BindERP y Supabase
