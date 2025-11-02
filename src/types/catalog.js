/**
 * @typedef {object} Product
 * @property {string} ID
 * @property {string} Code
 * @property {string} Title
 * @property {string} [Description]
 * @property {number} Cost
 * @property {number} CurrentInventory
 * @property {string} Unit
 * @property {boolean} ChargeVAT
 * @property {string | null} ImageUrl
 * @property {string | null} Category1ID
 */

/**
 * @typedef {object} CartItem
 * @property {string} product_id
 * @property {string} product_code
 * @property {string} product_name
 * @property {string} unit
 * @property {number} quantity
 * @property {number} unit_price
 * @property {boolean} charge_vat
 * @property {number} available_stock
 * @property {number} subtotal
 * @property {string} [notes]
 */

/**
 * @typedef {object} Cart
 * @property {CartItem[]} items
 * @property {number} subtotal
 * @property {number} vat
 * @property {number} total
 * @property {string} updated_at
 */