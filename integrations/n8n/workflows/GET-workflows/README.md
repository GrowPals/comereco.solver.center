# 🚀 WORKFLOWS GET - MIGRACIÓN BIND → SUPABASE

**Fecha:** 2025-11-06
**Propósito:** Workflows agregadores para sincronización eficiente de datos

---

## 📁 CONTENIDO DE ESTA CARPETA

```
GET-workflows/
├── README.md                           ← Estás aquí
├── DATA-MIGRATION-MAP.md               ← Mapeo detallado Bind → Supabase
├── AGGREGATOR-STRATEGY.md              ← Estrategia de workflows agregadores
└── WF-GET-SYNC-Products-Complete.json  ← Workflow principal de productos
```

---

## 🎯 CONCEPTO: WORKFLOWS AGREGADORES

En lugar de crear un workflow por cada endpoint GET, usamos **workflows agregadores** que:

1. ✅ Ejecutan **múltiples GETs en paralelo**
2. ✅ **Combinan y enriquecen** los datos
3. ✅ **Transforman** a formato Supabase
4. ✅ **Exportan** a TSV listo para importar

### Ventajas:
- ⚡ **Más rápido:** GETs en paralelo
- 📦 **Datos completos:** Enriquecimiento con múltiples fuentes
- 🔄 **Sincronización automática:** Cron job cada 15 minutos
- 🛠️ **Fácil mantenimiento:** Lógica centralizada

---

## 📦 WORKFLOW PRINCIPAL

### `WF-GET-SYNC-Products-Complete.json`

**Descripción:** Sincronización completa de productos con datos enriquecidos

**Arquitectura:**

```
[Trigger: cada 15 min]
         |
         ├─→ [GET /Products] ─────────┐
         ├─→ [GET /Prices] ───────────┤
         └─→ [GET /Inventory] ────────┤
                                      ↓
                          [AGGREGATOR - Combine]
                                      ↓
                          [TRANSFORM - Supabase]
                                      ↓
                          [EXPORT - TSV File]
```

### Nodos del Workflow:

| Nodo | Tipo | Descripción |
|------|------|-------------|
| **Trigger Every 15 Minutes** | Schedule Trigger | Ejecuta cada 15 minutos |
| **GET Products** | HTTP Request | Obtiene catálogo de productos |
| **GET Prices & Inventory** | HTTP Request | Obtiene precios y stock |
| **GET Inventory** | HTTP Request | Obtiene inventario detallado |
| **AGGREGATOR - Combine & Enrich** | Code Node | Combina y enriquece datos |
| **TRANSFORM - To Supabase Format** | Code Node | Convierte a formato Supabase |
| **EXPORT - Generate TSV File** | Code Node | Genera archivo TSV |

---

## 🔧 CONFIGURACIÓN INICIAL

### Paso 1: Importar Workflow a n8n

1. Abrir n8n
2. Click en **"+"** → **"Import from File"**
3. Seleccionar: `WF-GET-SYNC-Products-Complete.json`
4. Click **"Import"**

### Paso 2: Configurar Credenciales

**En los 3 nodos GET (Products, Prices, Inventory):**

1. Verificar que todos usen la credencial: `"Bind API Authorization"`
2. Si no existe, crear:
   - Tipo: `HTTP Header Auth`
   - Header Name: `Authorization`
   - Header Value: `Bearer {tu-token-bind}`

### Paso 3: Configurar Company ID

**En el nodo `TRANSFORM - To Supabase Format`:**

```javascript
// LÍNEA 14 - CAMBIAR ESTE VALOR:
const companyId = '00000000-0000-0000-0000-000000000000'; // ⚠️ REEMPLAZAR
```

**Cómo obtener tu Company ID:**
```sql
-- Ejecutar en Supabase SQL Editor:
SELECT id, name FROM companies;
```

### Paso 4: Ajustar Frecuencia (Opcional)

**En el nodo `Trigger Every 15 Minutes`:**

```json
{
  "cronExpression": "*/15 * * * *"  // Cada 15 minutos
}
```

**Otras opciones:**
- Cada 5 minutos: `"*/5 * * * *"`
- Cada 30 minutos: `"*/30 * * * *"`
- Cada hora: `"0 * * * *"`
- Diario a las 2am: `"0 2 * * *"`

---

## ▶️ CÓMO EJECUTAR

### Ejecución Manual (Primera vez)

1. Abrir workflow en n8n
2. Click en **"Execute Workflow"**
3. Esperar a que termine (30-60 segundos)
4. Ir al nodo final: `EXPORT - Generate TSV File`
5. **Click derecho** → **"Download binary data"**
6. Guardar archivo: `products_complete_YYYY-MM-DD.tsv`

### Importar a Supabase

1. Abrir Supabase Dashboard
2. Ir a **Table Editor** → **products**
3. Click **"Insert"** → **"Import data from CSV"**
4. Seleccionar archivo TSV descargado
5. Configurar:
   - **Format:** TSV (tab-separated)
   - **Header row:** Yes
   - **Conflict handling:** Upsert (actualizar si existe)
6. Click **"Import"**

### Ejecución Automática

Una vez activado el workflow:
- Se ejecutará automáticamente cada 15 minutos
- No genera archivo TSV (solo para ejecución manual)
- Deberías configurar un nodo final que haga UPSERT directo a Supabase

---

## 📊 QUÉ DATOS SE OBTIENEN

### Del endpoint `/Products`:
- `ID` → `bind_id`
- `Code` → `sku`
- `Title` → `name`
- `Description` → `description`
- `Cost` → `price` (base)
- `CurrentInventory` → `stock` (base)
- `Unit` → `unit`
- `TypeText` → `category`

### Del endpoint `/ProductsPriceAndInventory`:
- `Price` → `price` (actualizado, prioridad alta)
- `CurrentInventory` → `stock` (actualizado)

### Del endpoint `/Inventory`:
- `Quantity` → `stock` (prioridad máxima)
- `MinStock` → metadata
- `MaxStock` → metadata

### ¿Por qué múltiples GETs?

```
┌─────────────────────────────────────────────────────────┐
│  GET /Products                                          │
│  └─→ Info básica: nombre, descripción, categoría       │
│                                                         │
│  GET /ProductsPriceAndInventory                         │
│  └─→ Precios y stock actualizados de lista específica  │
│                                                         │
│  GET /Inventory                                         │
│  └─→ Stock real del almacén + límites min/max          │
│                                                         │
│  RESULTADO FINAL:                                       │
│  └─→ Producto con precio más actual y stock real       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 MONITOREO Y LOGS

### Ver Logs en n8n

1. Abrir workflow
2. Click en el nodo que quieres revisar
3. Ver **"Executions"** en panel derecho
4. Click en una ejecución para ver detalles

### Logs del Nodo AGGREGATOR

```
═══════════════════════════════════════════════════
🔄 INICIANDO AGREGACIÓN DE DATOS
═══════════════════════════════════════════════════

📥 Inputs recibidos: 3
✅ Products detectados: 150
✅ Inventory detectado: 150
✅ Prices detectado: 150

📊 RESUMEN DE DATOS OBTENIDOS:
   Products: 150
   Prices: 150
   Inventory: 150
═══════════════════════════════════════════════════

🗺️  Mapas creados:
   Price Map: 150 entradas
   Inventory Map: 150 entradas

🔨 PROCESANDO Y ENRIQUECIENDO PRODUCTOS...

✅ [1] Cloro Líquido
   SKU: PROD-001 | Precio: $9.5 | Stock: 150
✅ [2] Jabón Líquido
   SKU: PROD-002 | Precio: $12.0 | Stock: 200
✅ [3] Detergente en Polvo
   SKU: PROD-003 | Precio: $15.5 | Stock: 75
   ... procesando 147 productos más...

═══════════════════════════════════════════════════
✅ AGREGACIÓN COMPLETADA
═══════════════════════════════════════════════════
📦 Productos enriquecidos: 150
⚠️  Productos omitidos: 0
═══════════════════════════════════════════════════
```

---

## ⚠️ TROUBLESHOOTING

### Error: "No se encontraron productos"

**Causa:** El nodo GET Products falló o devolvió estructura inesperada

**Solución:**
1. Ejecutar solo el nodo `GET Products`
2. Ver el output en JSON
3. Verificar que tenga estructura:
   ```json
   {
     "value": [
       { "ID": "...", "Title": "..." }
     ]
   }
   ```

### Error: "company_id inválido"

**Causa:** No configuraste el Company ID en el nodo TRANSFORM

**Solución:**
1. Abrir nodo `TRANSFORM - To Supabase Format`
2. Línea 14, cambiar:
   ```javascript
   const companyId = 'TU-COMPANY-UUID-AQUI';
   ```

### Error: "401 Unauthorized"

**Causa:** Token de Bind expirado o inválido

**Solución:**
1. Ir a n8n → Credentials
2. Editar `Bind API Authorization`
3. Actualizar token
4. Guardar

### Error: "Price Map: 0 entradas"

**Causa:** El endpoint `/ProductsPriceAndInventory` falló (continueOnFail: true)

**Solución:**
- No es crítico, el workflow seguirá funcionando
- Usará precios de `/Products`
- Para arreglarlo, verifica:
  - ¿El `warehouseId` es correcto?
  - ¿El `priceListId` es correcto?

---

## 🚀 PRÓXIMOS PASOS

### 1. Automatización Completa (Futuro)

En lugar de exportar TSV manualmente, agregar nodo de **Upsert directo a Supabase:**

```
[TRANSFORM] → [Supabase Node: Upsert] → [Log Success]
```

### 2. Otros Workflows Agregadores

Crear workflows similares para:
- **Configuración:** Warehouses, Locations, Clients
- **Órdenes:** Sincronizar estado de órdenes creadas
- **Clientes:** Sincronizar clientes nuevos

### 3. Notificaciones

Agregar nodos de notificación:
- Email si falla
- Slack si hay productos nuevos
- Discord para resumen diario

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [DATA-MIGRATION-MAP.md](./DATA-MIGRATION-MAP.md) - Mapeo completo Bind → Supabase
- [AGGREGATOR-STRATEGY.md](./AGGREGATOR-STRATEGY.md) - Estrategia de workflows
- [BIND_API_MAP.md](../BIND_API_MAP.md) - Documentación de API de Bind

---

## ❓ PREGUNTAS FRECUENTES

### ¿Por qué TSV y no insertar directo?

**Para la migración inicial:**
- TSV es más rápido para grandes volúmenes
- Permite revisar datos antes de importar
- Fácil hacer rollback

**Para sincronización continua:**
- Usa nodo de Supabase directo (Upsert)
- Sin archivos intermedios
- Tiempo real

### ¿Cada cuánto ejecutar?

**Recomendaciones:**
- **Migración inicial:** Manual, una sola vez
- **Sincronización:** Cada 15-30 minutos
- **Productos críticos:** Cada 5 minutos
- **Backup diario:** Cada día a las 2am

### ¿Qué pasa con productos eliminados en Bind?

**Estrategia actual:**
- Solo actualiza productos existentes
- No elimina productos

**Estrategia recomendada:**
- Agregar nodo que marque `is_active = false` si no aparece en GET
- O agregar campo `last_seen_at` para detectar productos obsoletos

---

**Creado:** 2025-11-06
**Por:** Claude Code Agent
**Versión:** 1.0
