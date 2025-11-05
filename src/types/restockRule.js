/**
 * @typedef {object} RestockRule
 * @property {string} id
 * @property {string} company_id
 * @property {string} product_id
 * @property {string | null} project_id
 * @property {number} min_stock
 * @property {number} reorder_quantity
 * @property {'active' | 'paused'} status
 * @property {string | null} notes
 * @property {string | null} preferred_vendor
 * @property {string | null} preferred_warehouse
 * @property {string} created_by
 * @property {string | null} updated_by
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {object} RestockRuleWithRelations
 * @property {RestockRule} rule
 * @property {{ id: string, name: string, sku: string, stock: number, category: string | null, image_url: string | null }} [products]
 * @property {{ id: string, name: string, status: string }} [projects]
 */

