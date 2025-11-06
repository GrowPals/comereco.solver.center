# 📥 Bind Data - Entrada de JSONs

Pega aquí los outputs de tus workflows de n8n.

## 📝 Archivos Requeridos

### **products_raw.json** ⭐ REQUERIDO

**Endpoint:** `GET /Products`

**Ejemplo de estructura:**
```json
{
  "value": [
    {
      "ID": "uuid-del-producto",
      "Code": "SKU001",
      "Title": "Nombre del producto",
      "Description": "Descripción",
      "Cost": 100.50,
      "CurrentInventory": 25,
      "IsActive": true,
      "Type": 0,
      "TypeText": "Producto Terminado",
      "Unit": "Pieza"
    }
  ]
}
```

## 📝 Archivos Opcionales (Enrichment)

Estos archivos **mejoran** los datos pero no son obligatorios:

### **products_prices.json** (Mejora precios)

**Endpoint:** `GET /Products/Prices` o `GET /Prices`

**Mejora:** Precios más actualizados que `product.Cost`

### **categories_raw.json** (Mejora categorías)

**Endpoint:** `GET /Categories`

**Mejora:** Categorías estructuradas en vez de `product.TypeText`

## 🔄 Workflow en n8n

1. **HTTP Request Node**
   - Method: GET
   - URL: `https://api.bind.com.mx/v1/Products`
   - Authentication: Bearer Token
   - Headers:
     ```
     Accept: application/json
     Ocp-Apim-Subscription-Key: tu-key
     ```

2. **Copiar Output**
   - Ejecuta el workflow
   - Copia el JSON completo
   - Pégalo aquí como `products_raw.json`

## ⚠️ Importante

### Formato JSON

El sistema acepta dos formatos:

**Formato OData** (preferido):
```json
{
  "value": [
    { ... producto 1 ... },
    { ... producto 2 ... }
  ]
}
```

**Array directo** (también funciona):
```json
[
  { ... producto 1 ... },
  { ... producto 2 ... }
]
```

**Array mal envuelto** (también funciona):
```json
[
  {
    "value": [
      { ... producto 1 ... }
    ]
  }
]
```

### Nombrado Exacto

⚠️ Los nombres deben ser exactos:
- ✅ `products_raw.json`
- ✅ `products_prices.json`
- ✅ `categories_raw.json`
- ❌ `Products.json`
- ❌ `products.json`

## 📋 Checklist

Antes de ejecutar `npm run migrate`:

- [ ] `products_raw.json` está en esta carpeta
- [ ] El archivo tiene formato JSON válido
- [ ] El archivo no está vacío
- [ ] Ya editaste `scripts/config.js` con tu `companyId`

## 🔍 Verificar JSON

Para verificar que tu JSON es válido:

```bash
python3 -m json.tool products_raw.json > /dev/null && echo "✅ Válido" || echo "❌ Inválido"
```

## 💡 Tip: Paginación

Si Bind tiene paginación, combina todos los registros en un solo JSON:

```json
{
  "value": [
    // ... todos los productos de todas las páginas ...
  ]
}
```

---

**Siguiente paso:** Edita [../scripts/config.js](../scripts/config.js) y ejecuta `npm run migrate`
