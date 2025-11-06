# 📤 TSV Generados - Listos para Importar

Archivos TSV generados por el sistema, listos para importar a Supabase.

## 📋 Archivo Generado

### **products.tsv**

**Tabla destino:** `products`

**Contiene:** Catálogo completo de productos procesados y validados

## 📥 Cómo Importar a Supabase

### Paso 1: Abrir Supabase

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Table Editor**
4. Selecciona la tabla **`products`**

### Paso 2: Importar TSV

1. Click en **"Insert" → "Import data from CSV"**
2. Selecciona `products.tsv` de esta carpeta
3. Configura:
   - **Delimiter:** Tab (o `\t`)
   - **First row is header:** ✅ Activado
   - **Encoding:** UTF-8
4. Click en **"Import"**
5. Espera a que termine (puede tomar minutos si son muchos productos)

### Paso 3: Verificar

En **SQL Editor**, ejecuta:

```sql
-- Contar productos importados
SELECT COUNT(*) as total_products
FROM products
WHERE company_id = 'tu-company-id';

-- Ver algunos productos
SELECT sku, name, price, stock, category
FROM products
WHERE company_id = 'tu-company-id'
LIMIT 10;
```

## ⚙️ Formato TSV

### Estructura

- **Delimitador:** Tab (`\t`)
- **Primera línea:** Headers con nombres de columnas
- **NULL:** Representado como `\N` (formato PostgreSQL)
- **Boolean:** `t` (true) o `f` (false)
- **Timestamp:** `YYYY-MM-DD HH:MM:SS`

### Ejemplo

```
company_id	bind_id	sku	name	price	stock	category	is_active	created_at	updated_at
550e8400-...	abc-123	SKU001	Producto 1	100.50	25	Categoría A	t	2025-11-06 10:00:00	2025-11-06 10:00:00
```

## ⚠️ Troubleshooting

### Error: "Duplicate key violates unique constraint"

**Causa:** Ya existe un registro con el mismo `company_id + bind_id` o `company_id + sku`

**Solución:**

1. Elimina registros existentes:
```sql
DELETE FROM products WHERE company_id = 'tu-company-id';
```

2. Vuelve a importar

### Error: "Invalid input syntax for type uuid"

**Causa:** El `company_id` en `config.js` no es un UUID válido

**Solución:**
1. Verifica que el UUID en `scripts/config.js` sea correcto
2. Re-ejecuta `npm run migrate`

### TSV vacío o solo con headers

**Causa:** Todos los registros fueron omitidos por validación

**Solución:**
1. Ejecuta `npm run migrate:verbose`
2. Revisa `03-logs/migration_*.log`
3. Corrige los datos en `products_raw.json`
4. Re-ejecuta la migración

## 🔍 Verificación Post-Importación

Después de importar, verifica:

```sql
-- Productos sin precio
SELECT COUNT(*) FROM products WHERE price = 0 OR price IS NULL;

-- Productos sin stock
SELECT COUNT(*) FROM products WHERE stock = 0;

-- Productos sin SKU (no deberían existir)
SELECT COUNT(*) FROM products WHERE sku IS NULL OR sku = '';

-- Productos sin categoría
SELECT COUNT(*) FROM products WHERE category IS NULL OR category = '';
```

Si encuentras muchos registros con campos vacíos, considera:
1. Agregar los archivos de enrichment (`products_prices.json`, `categories_raw.json`)
2. Re-ejecutar la migración

## 📊 Estadísticas Típicas

Migración exitosa:

```
Total procesado: ~100 productos
Total omitidos: 0-5 (productos inactivos o sin SKU)
Total errores: 0-4 (SKUs duplicados)
Archivos generados: 1 (products.tsv)
```

## 🗑️ Limpieza

Después de importar exitosamente:

1. **Verifica** que los datos estén en Supabase
2. **Backup** del TSV (opcional)
3. **Puedes eliminar** el TSV de esta carpeta

Para hacer backup:

```bash
tar -czf migration-backup-$(date +%Y%m%d).tar.gz products.tsv
mv migration-backup-*.tar.gz ~/backups/
```

## 🎉 ¡Listo!

Si la importación fue exitosa:

✅ Productos migrados a Supabase
✅ Sistema listo para usarse

---

**¿Problemas?** Consulta [../README.md](../README.md) o revisa logs en `03-logs/`
