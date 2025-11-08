# 🔄 ESTRATEGIA DE SINCRONIZACIÓN AGREGADA: BIND → SUPABASE

**Fecha:** 2025-11-06
**Objetivo:** Sincronización eficiente con múltiples GETs combinados en un solo workflow

---

## 🎯 CONCEPTO: WORKFLOW AGREGADOR

En lugar de hacer workflows separados (A→B), hacemos un workflow que:
1. **GET múltiple en paralelo** (A₁, A₂, A₃... desde Bind)
2. **Agregación/Combinación** (A₁ + A₂ + A₃ → B)
3. **Transformación a Supabase** (B → C formato TSV)

```
┌─────────────────────────────────────────────────────┐
│         BIND ERP (Múltiples Endpoints)              │
└─────────────────────────────────────────────────────┘
           │
           ├─── GET /Products ─────────┐
           ├─── GET /Categories ───────┤
           ├─── GET /Inventory ────────┤  Paralelo
           ├─── GET /PriceLists ───────┤
           └─── GET /Warehouses ───────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  NODO AGREGADOR     │
           │  (Merge + Enrich)   │
           └─────────────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  NODO TRANSFORMADOR │
           │  (Map to Supabase)  │
           └─────────────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │  TSV EXPORT         │
           │  (Ready to Import)  │
           └─────────────────────┘
```

---

## 📦 EJEMPLO: SINCRONIZACIÓN COMPLETA DE PRODUCTOS

### Workflow: `WF-GET-SYNC-Products-Complete.json`

**Frecuencia:** Cada 15 minutos (configurable)

### Fase 1: GET Paralelo (5 nodos ejecutándose simultáneamente)

```javascript
// Nodo 1: GET Products
GET /Products?$top=1000&$skip=0
→ Output: Lista de productos con info básica

// Nodo 2: GET Categories (si existe endpoint)
GET /Categories o GET /ProductCategories
→ Output: Mapeo de CategoryID → Nombre

// Nodo 3: GET Inventory
GET /Inventory?warehouseId=a8605382-7b48-47e2-9fb6-a25cfb7cf735
→ Output: Stock actualizado por producto

// Nodo 4: GET PriceLists
GET /ProductsPriceAndInventory?warehouseId=...&priceListId=...
→ Output: Precios especiales por lista

// Nodo 5: GET Units (si existe)
GET /Units o similar
→ Output: Unidades de medida detalladas
```

### Fase 2: Nodo Agregador (Code Node)

```javascript
// ═══════════════════════════════════════════════════════════
// NODO AGREGADOR - COMBINAR MÚLTIPLES GETS
// ═══════════════════════════════════════════════════════════

// Recibir todos los inputs
const inputs = $input.all();

// Identificar cada input por su origen (usando parámetros del nodo)
const products = inputs.find(i => i.json.source === 'products')?.json.value || [];
const categories = inputs.find(i => i.json.source === 'categories')?.json.value || [];
const inventory = inputs.find(i => i.json.source === 'inventory')?.json.value || [];
const priceLists = inputs.find(i => i.json.source === 'pricelists')?.json.value || [];

// Crear mapas para búsqueda rápida O(1)
const categoryMap = new Map();
categories.forEach(cat => {
  categoryMap.set(cat.ID, cat.Name);
});

const inventoryMap = new Map();
inventory.forEach(inv => {
  inventoryMap.set(inv.ProductID, inv.Quantity);
});

const priceMap = new Map();
priceLists.forEach(price => {
  priceMap.set(price.ID, price.Price);
});

// ═══════════════════════════════════════════════════════════
// ENRIQUECER PRODUCTOS CON TODA LA DATA
// ═══════════════════════════════════════════════════════════

const enrichedProducts = products.map(product => {
  // Obtener categoría real desde el map
  const category1Name = categoryMap.get(product.Category1ID) || 'Sin categoría';
  const category2Name = categoryMap.get(product.Category2ID);
  const category3Name = categoryMap.get(product.Category3ID);

  // Construir categoría completa
  let fullCategory = category1Name;
  if (category2Name) fullCategory += ` > ${category2Name}`;
  if (category3Name) fullCategory += ` > ${category3Name}`;

  // Obtener stock actualizado (prioridad a Inventory)
  const stock = inventoryMap.get(product.ID) ?? product.CurrentInventory ?? 0;

  // Obtener precio actualizado (prioridad a PriceList)
  const price = priceMap.get(product.ID) ?? product.Cost ?? 0;

  // Retornar producto enriquecido
  return {
    bind_id: product.ID,
    sku: product.Code || product.SKU || product.ID,
    name: product.Title,
    description: product.Description || '',
    price: price,
    stock: stock,
    unit: product.Unit || 'Pieza',
    category: fullCategory,
    is_active: stock > 0,

    // Metadata adicional
    bind_metadata: {
      type: product.Type,
      type_text: product.TypeText,
      number: product.Number,
      charge_vat: product.ChargeVAT,
      currency_code: product.CurrencyCode,
      creation_date: product.CreationDate,
      category_ids: {
        cat1: product.Category1ID,
        cat2: product.Category2ID,
        cat3: product.Category3ID
      }
    }
  };
});

console.log(`✅ Productos enriquecidos: ${enrichedProducts.length}`);

return enrichedProducts.map(p => ({ json: p }));
```

### Fase 3: Nodo Transformador a Supabase

```javascript
// ═══════════════════════════════════════════════════════════
// TRANSFORMAR A FORMATO SUPABASE
// ═══════════════════════════════════════════════════════════

const enrichedProducts = $input.all();
const companyId = '<COMPANY_UUID>'; // Obtener del contexto o env

const supabaseProducts = enrichedProducts.map(({ json: product }) => {
  return {
    company_id: companyId,
    bind_id: product.bind_id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    unit: product.unit,
    category: product.category,
    image_url: null, // Agregar manualmente después
    is_active: product.is_active,
    bind_last_synced_at: new Date().toISOString(),
    bind_sync_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
});

return supabaseProducts.map(p => ({ json: p }));
```

### Fase 4: TSV Export

```javascript
// (Igual que antes, genera TSV con todos los campos)
```

---

## 🎯 VENTAJAS DE ESTE ENFOQUE

### ✅ Eficiencia:
- Una sola ejecución cada 15 minutos
- Múltiples GETs en paralelo (más rápido)
- Una sola transformación
- Un solo TSV final

### ✅ Datos Completos:
- Categorías con nombres reales (no UUIDs)
- Stock en tiempo real
- Precios actualizados
- Metadata completa

### ✅ Mantenibilidad:
- Un solo workflow para productos
- Fácil agregar más GETs si es necesario
- Lógica centralizada

### ✅ Sincronización:
- Cron job cada 15 minutos
- Detecta cambios automáticamente
- Actualiza solo lo necesario (UPSERT en Supabase)

---

## 📋 WORKFLOWS AGREGADORES NECESARIOS

### 1️⃣ WF-GET-SYNC-Products-Complete.json ⭐ PRIORIDAD
**Frecuencia:** Cada 15 minutos
**GETs incluidos:**
- `/Products`
- `/ProductsPriceAndInventory`
- `/Inventory`
- `/Categories` (si existe)

**Output:** `products` table completa

---

### 2️⃣ WF-GET-SYNC-Config-Complete.json
**Frecuencia:** Una sola vez (setup inicial) o diario
**GETs incluidos:**
- `/Warehouses`
- `/Locations`
- `/Clients`
- `/PriceLists`

**Output:** `bind_mappings` + `companies` configurados

---

### 3️⃣ WF-GET-SYNC-Orders-Status.json (Futuro)
**Frecuencia:** Cada 5 minutos
**GETs incluidos:**
- `/Orders`
- `/Orders/{id}` (detalles de cada orden)

**Output:** Actualizar `requisitions.bind_status`

---

## 🔧 CONFIGURACIÓN DE NODOS EN N8N

### Nodos en paralelo:

```json
{
  "nodes": [
    {
      "name": "GET Products",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.bind.com.mx/api/Products?$top=1000",
        "options": {
          "response": {
            "response": {
              "postReceive": [
                {
                  "type": "setKeyValue",
                  "setKeyValue": {
                    "key": "source",
                    "value": "products"
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      "name": "GET Inventory",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.bind.com.mx/api/Inventory?warehouseId={{$env.BIND_WAREHOUSE_ID}}",
        "options": {
          "response": {
            "response": {
              "postReceive": [
                {
                  "type": "setKeyValue",
                  "setKeyValue": {
                    "key": "source",
                    "value": "inventory"
                  }
                }
              ]
            }
          }
        }
      }
    }
    // ... más nodos GET ...
  ],
  "connections": {
    "GET Products": {
      "main": [[{ "node": "Aggregator", "type": "main", "index": 0 }]]
    },
    "GET Inventory": {
      "main": [[{ "node": "Aggregator", "type": "main", "index": 0 }]]
    }
    // Todos convergen en el nodo Aggregator
  }
}
```

---

## ⚠️ MANEJO DE ERRORES

### Estrategia:

1. **Cada GET tiene retry:**
   ```json
   {
     "retryOnFail": true,
     "maxTries": 3,
     "continueOnFail": true
   }
   ```

2. **Aggregator verifica qué datos llegaron:**
   ```javascript
   if (products.length === 0) {
     throw new Error('No se pudieron obtener productos');
   }

   if (categories.length === 0) {
     console.warn('⚠️ Categorías no disponibles, usando TypeText');
     // Usar fallback
   }
   ```

3. **Logging completo:**
   ```javascript
   console.log('═══════════════════════════════════');
   console.log('📊 RESUMEN DE SINCRONIZACIÓN');
   console.log('═══════════════════════════════════');
   console.log(`✅ Productos: ${products.length}`);
   console.log(`✅ Categorías: ${categories.length}`);
   console.log(`✅ Inventario: ${inventory.length}`);
   console.log(`✅ Listas precio: ${priceLists.length}`);
   console.log('═══════════════════════════════════');
   ```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Verificar qué endpoints GET existen en BindERP
   - ¿Existe `/Categories`?
   - ¿Existe `/Units`?
   - ¿Qué otros endpoints pueden enriquecer productos?

2. ⏭️ Crear `WF-GET-SYNC-Products-Complete.json`
   - Implementar los 3-5 GETs en paralelo
   - Crear nodo agregador
   - Crear nodo transformador
   - Crear TSV export

3. ⏭️ Probar workflow completo
   - Ejecutar manualmente
   - Verificar TSV generado
   - Importar a Supabase
   - Validar datos

4. ⏭️ Configurar cron job
   - Cada 15 minutos
   - Monitorear logs
   - Alertas en caso de error

---

**¿Necesitas que investigue qué otros endpoints GET existen en BindERP para enriquecer productos?**
