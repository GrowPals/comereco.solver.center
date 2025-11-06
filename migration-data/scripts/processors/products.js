/**
 * 📦 PROCESADOR DE PRODUCTS
 *
 * Transforma datos de Bind ERP a formato Supabase products
 * Soporta enrichment con prices, inventory y categories
 */

const { cleanString, cleanNumber, cleanInteger, normalizeSku } = require('../utils/cleaners');
const { formatTimestamp } = require('../utils/date-formatter');

module.exports = {
  // ═══════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════

  name: 'products',
  description: 'Procesa catálogo de productos con enrichment de precios, stock y categorías',
  priority: 1,

  // ═══════════════════════════════════════════════════════════════
  // FUENTES DE DATOS
  // ═══════════════════════════════════════════════════════════════

  sources: {
    primary: 'products_raw.json',           // OBLIGATORIO
    enrichment: {
      prices: 'products_prices.json',       // OPCIONAL
      inventory: 'inventory_raw.json',      // OPCIONAL
      categories: 'categories_raw.json'     // OPCIONAL
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // TARGET
  // ═══════════════════════════════════════════════════════════════

  target: {
    table: 'products',
    tsv: 'products.tsv',
    headers: [
      'company_id',
      'bind_id',
      'sku',
      'name',
      'description',
      'price',
      'stock',
      'unit',
      'category',
      'image_url',
      'is_active',
      'bind_last_synced_at',
      'bind_sync_enabled',
      'created_at',
      'updated_at'
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // PREPARAR ENRICHMENT DATA
  // ═══════════════════════════════════════════════════════════════

  async prepareEnrichment(context) {
    const { fileReader, logger } = context;

    const enrichment = {
      prices: new Map(),
      inventory: new Map(),
      categories: new Map()
    };

    // ─────────────────────────────────────────────────────────────
    // 1. Cargar products_prices.json
    // ─────────────────────────────────────────────────────────────

    if (fileReader.exists('products_prices.json')) {
      logger.info('   Cargando products_prices.json...');
      const pricesData = fileReader.readOptional('products_prices.json');

      pricesData.forEach(p => {
        if (p.ID) {
          enrichment.prices.set(p.ID, {
            price: cleanNumber(p.Price, 0),
            stock: cleanInteger(p.CurrentInventory, 0)
          });
        }
      });

      logger.success(`   Prices cargados: ${enrichment.prices.size} registros`);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Cargar inventory_raw.json
    // ─────────────────────────────────────────────────────────────

    if (fileReader.exists('inventory_raw.json')) {
      logger.info('   Cargando inventory_raw.json...');
      const inventoryData = fileReader.readOptional('inventory_raw.json');

      inventoryData.forEach(inv => {
        if (inv.ProductID) {
          enrichment.inventory.set(inv.ProductID, {
            quantity: cleanInteger(inv.Quantity, 0),
            minStock: cleanInteger(inv.MinStock, 0),
            maxStock: cleanInteger(inv.MaxStock, 0)
          });
        }
      });

      logger.success(`   Inventory cargado: ${enrichment.inventory.size} registros`);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Cargar categories_raw.json
    // ─────────────────────────────────────────────────────────────

    if (fileReader.exists('categories_raw.json')) {
      logger.info('   Cargando categories_raw.json...');
      const categoriesData = fileReader.readOptional('categories_raw.json');

      categoriesData.forEach(cat => {
        if (cat.ID) {
          enrichment.categories.set(cat.ID, cleanString(cat.Name));
        }
      });

      logger.success(`   Categories cargadas: ${enrichment.categories.size} registros`);
    }

    return enrichment;
  },

  // ═══════════════════════════════════════════════════════════════
  // TRANSFORMACIÓN
  // ═══════════════════════════════════════════════════════════════

  transform(product, context, enrichment) {
    const { companyId } = context;

    // ─────────────────────────────────────────────────────────────
    // 1. Validar producto fuente
    // ─────────────────────────────────────────────────────────────

    if (!product.ID || String(product.ID).trim() === '') {
      return { skip: true, reason: 'ID vacío o nulo' };
    }

    const bind_id = String(product.ID).trim();

    // ─────────────────────────────────────────────────────────────
    // 2. Construir SKU con fallbacks
    // ─────────────────────────────────────────────────────────────

    let sku = normalizeSku(product.Code) ||
              normalizeSku(product.SKU) ||
              normalizeSku(product.Number) ||
              bind_id;

    if (!sku || sku.trim() === '') {
      return { skip: true, reason: 'SKU vacío después de limpieza' };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Construir name (obligatorio)
    // ─────────────────────────────────────────────────────────────

    const name = cleanString(product.Title) || cleanString(product.Name);

    if (!name) {
      return { skip: true, reason: 'name vacío' };
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Description (opcional)
    // ─────────────────────────────────────────────────────────────

    const description = cleanString(product.Description);

    // ─────────────────────────────────────────────────────────────
    // 5. Price (con enrichment y priorización)
    // ─────────────────────────────────────────────────────────────

    let price = 0;

    const priceData = enrichment.prices.get(product.ID);
    if (priceData && priceData.price !== undefined) {
      price = priceData.price;
    } else if (product.Cost !== undefined && product.Cost !== null) {
      price = cleanNumber(product.Cost, 0);
    } else if (product.Price !== undefined && product.Price !== null) {
      price = cleanNumber(product.Price, 0);
    }

    // Asegurar >= 0
    if (price < 0) price = 0;

    // Redondear a 2 decimales
    price = Math.round(price * 100) / 100;

    // ─────────────────────────────────────────────────────────────
    // 6. Stock (con enrichment y priorización)
    // ─────────────────────────────────────────────────────────────

    let stock = 0;

    const inventoryData = enrichment.inventory.get(product.ID);
    if (inventoryData && inventoryData.quantity !== undefined) {
      stock = inventoryData.quantity;
    } else if (priceData && priceData.stock !== undefined) {
      stock = priceData.stock;
    } else if (product.CurrentInventory !== undefined && product.CurrentInventory !== null) {
      stock = cleanInteger(product.CurrentInventory, 0);
    } else if (product.Quantity !== undefined && product.Quantity !== null) {
      stock = cleanInteger(product.Quantity, 0);
    }

    // Asegurar >= 0
    if (stock < 0) stock = 0;

    // Forzar entero
    stock = Math.floor(stock);

    // ─────────────────────────────────────────────────────────────
    // 7. Unit (opcional)
    // ─────────────────────────────────────────────────────────────

    const unit = cleanString(product.Unit);

    // ─────────────────────────────────────────────────────────────
    // 8. Category (con enrichment)
    // ─────────────────────────────────────────────────────────────

    let category = null;

    // Si hay categories enrichment, construir jerarquía
    if (enrichment.categories.size > 0) {
      const cat1 = enrichment.categories.get(product.Category1ID);
      const cat2 = enrichment.categories.get(product.Category2ID);
      const cat3 = enrichment.categories.get(product.Category3ID);

      const parts = [];
      if (cat1) parts.push(cat1);
      if (cat2) parts.push(cat2);
      if (cat3) parts.push(cat3);

      if (parts.length > 0) {
        category = parts.join(' > ');
      }
    }

    // Fallback a TypeText
    if (!category) {
      category = cleanString(product.TypeText);
    }

    // Fallback a Category directo
    if (!category) {
      category = cleanString(product.Category);
    }

    // Si es servicio, agregar prefijo
    const isService = product.Type === 2 ||
                      (product.TypeText && product.TypeText.toLowerCase() === 'servicio');

    if (isService && category) {
      category = 'Servicio: ' + category;
    }

    // ─────────────────────────────────────────────────────────────
    // 9. is_active (calculado)
    // ─────────────────────────────────────────────────────────────

    const is_active = stock > 0;

    // ─────────────────────────────────────────────────────────────
    // 10. Timestamps
    // ─────────────────────────────────────────────────────────────

    const now = formatTimestamp();

    // ─────────────────────────────────────────────────────────────
    // 11. Construir registro final
    // ─────────────────────────────────────────────────────────────

    return {
      skip: false,
      record: {
        company_id: companyId,
        bind_id: bind_id,
        sku: sku,
        name: name,
        description: description,
        price: price,
        stock: stock,
        unit: unit,
        category: category,
        image_url: null,
        is_active: is_active,
        bind_last_synced_at: now,
        bind_sync_enabled: true,
        created_at: now,
        updated_at: now
      }
    };
  }
};
