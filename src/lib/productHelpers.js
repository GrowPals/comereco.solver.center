/**
 * Utilidades para normalización y manejo de productos
 *
 * Centraliza la lógica de mapeo y normalización de datos de productos
 * para mantener consistencia en toda la aplicación.
 */

/**
 * Normaliza un objeto de producto para asegurar propiedades consistentes
 * Maneja variaciones en nombres de propiedades (name/nombre, price/precio, etc.)
 *
 * @param {Object} product - Objeto de producto con propiedades variables
 * @returns {Object} Objeto normalizado con propiedades estándar
 *
 * @example
 * const product = { nombre: "Producto", precio: 100 };
 * const normalized = normalizeProduct(product);
 * // normalized = { name: "Producto", price: 100, unit: "Pieza", ... }
 */
export const normalizeProduct = (product) => {
  if (!product) {
    return {
      name: 'Producto sin nombre',
      price: 0,
      unit: 'Pieza',
      sku: '',
      description: '',
      category: '',
      imageUrl: '',
      stock: null,
      isInStock: true,
    };
  }

  const stock = Number.isFinite(product.stock)
    ? product.stock
    : product.existencias;

  return {
    // Propiedades básicas
    name: product.name || product.nombre || 'Producto sin nombre',
    price: product.price || product.precio || 0,
    unit: product.unit || product.unidad || 'Pieza',
    sku: product.sku || product.product_key || '',
    description: product.description || product.descripcion || '',
    category: product.category_name || product.categoria || '',

    // Imagen
    imageUrl: product.image_url || product.image || '',

    // Stock
    stock,
    isInStock: stock === undefined || stock === null ? true : stock > 0,

    // Propiedades originales (por si se necesitan)
    ...product,
  };
};

/**
 * Extrae el nombre para mostrar de un producto
 * @param {Object} product - Objeto de producto
 * @returns {string} Nombre del producto
 */
export const getProductName = (product) => {
  return product?.name || product?.nombre || 'Producto sin nombre';
};

/**
 * Extrae el precio de un producto
 * @param {Object} product - Objeto de producto
 * @returns {number} Precio del producto
 */
export const getProductPrice = (product) => {
  return Number(product?.price || product?.precio || 0);
};

/**
 * Extrae la unidad de un producto
 * @param {Object} product - Objeto de producto
 * @returns {string} Unidad del producto
 */
export const getProductUnit = (product) => {
  return product?.unit || product?.unidad || 'Pieza';
};

/**
 * Extrae el SKU de un producto
 * @param {Object} product - Objeto de producto
 * @returns {string} SKU del producto
 */
export const getProductSKU = (product) => {
  return product?.sku || product?.product_key || '';
};

/**
 * Verifica si un producto está en stock
 * @param {Object} product - Objeto de producto
 * @returns {boolean} true si está en stock
 */
export const isProductInStock = (product) => {
  const stock = Number.isFinite(product?.stock)
    ? product.stock
    : product?.existencias;

  return stock === undefined || stock === null ? true : stock > 0;
};

/**
 * Obtiene el stock de un producto
 * @param {Object} product - Objeto de producto
 * @returns {number|null} Cantidad en stock o null si no disponible
 */
export const getProductStock = (product) => {
  return Number.isFinite(product?.stock)
    ? product.stock
    : product?.existencias;
};
