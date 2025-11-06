# 🚀 Migración de Productos: Bind ERP → Supabase

Sistema simple y optimizado para migrar el catálogo de productos desde Bind ERP a Supabase.

## 🎯 Inicio Rápido (3 pasos)

### 1. Obtener datos de Bind

En **n8n**, ejecuta estos workflows GET y pega los outputs en `01-raw-bind-data/`:

```
GET /Products          → products_raw.json          (REQUERIDO)
GET /Products/Prices   → products_prices.json       (Opcional - mejora precios)
GET /Categories        → categories_raw.json        (Opcional - mejora categorías)
```

### 2. Configurar

Edita `scripts/config.js` y actualiza tu `companyId`:

```javascript
companyId: '2ea0aa65-6319-415e-a153-31c9804c352f'  // Tu UUID de Supabase
```

### 3. Ejecutar

```bash
cd migration-data/scripts
npm install          # Solo la primera vez
npm run migrate
```

**Output:** `02-processed-tsv/products.tsv` listo para importar a Supabase.

## 📥 Importar a Supabase

1. Ve a **Supabase Dashboard** → **Table Editor** → Tabla `products`
2. Click en **"Insert" → "Import data from CSV"**
3. Selecciona `02-processed-tsv/products.tsv`
4. Configuración:
   - Delimiter: **Tab** (`\t`)
   - First row is header: ✅ Activado
   - Encoding: UTF-8
5. **Import** y espera

## 📁 Estructura

```
migration-data/
├── 01-raw-bind-data/           # Pega aquí los JSONs de n8n
│   ├── products_raw.json       ⭐ REQUERIDO
│   ├── products_prices.json    (Opcional)
│   └── categories_raw.json     (Opcional)
│
├── 02-processed-tsv/           # TSVs generados
│   └── products.tsv            → Importar a Supabase
│
├── 03-logs/                    # Logs automáticos
│
└── scripts/                    # Sistema de procesamiento
    ├── config.js               ⚙️ EDITA AQUÍ tu company_id
    ├── migrate.js              🚀 Script principal
    └── processors/products.js  📦 Transformador de productos
```

## ⚙️ Configuración Rápida

Edita `scripts/config.js`:

```javascript
module.exports = {
  companyId: 'TU-UUID-AQUI',  // ⚠️ CAMBIAR

  filters: {
    products: {
      activeOnly: false,      // Solo productos activos
      minStock: 0,            // Stock mínimo
      minPrice: 0             // Precio mínimo
    }
  }
};
```

## 🚀 Comandos

```bash
npm run migrate          # Migración completa
npm run migrate:verbose  # Con detalles
npm run migrate:dry-run  # Solo validar
```

## ✨ Features

### Enrichment Inteligente

Combina datos de múltiples fuentes:

- **Precios**: products_prices.json → product.Cost → 0
- **Stock**: inventory → prices → product.CurrentInventory → 0
- **Categorías**: categories.json (3 niveles) → product.TypeText
- **SKU**: Code → SKU → Number → ID

### Validaciones Automáticas

16 validaciones por producto:
- NOT NULL, CHECK constraints, UNIQUE, tipos, límites

Productos con errores se omiten y se reportan en logs.

## 🔍 Troubleshooting

### "company_id no configurado"
→ Edita `scripts/config.js`

### "No se encontraron archivos JSON"
→ Pega outputs de n8n en `01-raw-bind-data/`

### "SKU duplicado"
→ Asigna SKUs únicos en Bind

### Archivos opcionales faltantes
→ No es crítico, usa fallbacks

## 📊 Output Esperado

```
Total procesado: 96 productos
Total omitidos: 0
Total errores: 4 (SKUs duplicados)
Archivos generados: 1 (products.tsv)
```

## ✅ Verificación

Después de importar a Supabase:

```sql
SELECT COUNT(*) FROM products
WHERE company_id = 'tu-uuid';
```

---

**¿Problemas?** Revisa `03-logs/` o ejecuta `npm run migrate:verbose`.
