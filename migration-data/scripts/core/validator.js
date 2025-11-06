/**
 * ✔️ SISTEMA DE VALIDACIÓN DE REGISTROS
 */

const { isValidUuid } = require('../utils/uuid-validator');

class Validator {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Valida un registro según su tipo
   * @param {string} type - Tipo de registro ('products', 'clients', etc.)
   * @param {object} record - Registro a validar
   * @param {object[]} allRecords - Todos los registros (para validar unicidad)
   * @param {number} index - Índice del registro
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validate(type, record, allRecords = [], index = 0) {
    const validator = this[`validate${this.capitalize(type)}`];

    if (!validator) {
      this.logger.warn(`No hay validador para tipo: ${type}`);
      return { valid: true, errors: [], warnings: [] };
    }

    return validator.call(this, record, allRecords, index);
  }

  /**
   * Valida un producto
   */
  validateProducts(record, allRecords, index) {
    const errors = [];
    const warnings = [];

    // ═══════════════════════════════════════════════════════════
    // NOT NULL validations
    // ═══════════════════════════════════════════════════════════

    if (!record.company_id) {
      errors.push('company_id es NULL');
    }

    if (!record.bind_id || record.bind_id.trim() === '') {
      errors.push('bind_id es NULL o vacío');
    }

    if (!record.sku || record.sku.trim() === '') {
      errors.push('sku es NULL o vacío');
    }

    if (!record.name || record.name.trim() === '') {
      errors.push('name es NULL o vacío');
    }

    if (record.price === null || record.price === undefined) {
      errors.push('price es NULL');
    }

    if (record.stock === null || record.stock === undefined) {
      errors.push('stock es NULL');
    }

    // ═══════════════════════════════════════════════════════════
    // CHECK constraints
    // ═══════════════════════════════════════════════════════════

    if (record.price < 0) {
      errors.push(`price es negativo: ${record.price}`);
    }

    if (record.stock < 0) {
      errors.push(`stock es negativo: ${record.stock}`);
    }

    // ═══════════════════════════════════════════════════════════
    // Type validations
    // ═══════════════════════════════════════════════════════════

    if (typeof record.price !== 'number' || isNaN(record.price)) {
      errors.push(`price no es número válido: ${record.price}`);
    }

    if (typeof record.stock !== 'number' || isNaN(record.stock) || !Number.isInteger(record.stock)) {
      errors.push(`stock no es entero válido: ${record.stock}`);
    }

    if (typeof record.is_active !== 'boolean') {
      errors.push(`is_active no es boolean: ${record.is_active}`);
    }

    if (typeof record.bind_sync_enabled !== 'boolean') {
      errors.push(`bind_sync_enabled no es boolean: ${record.bind_sync_enabled}`);
    }

    // ═══════════════════════════════════════════════════════════
    // UUID validation
    // ═══════════════════════════════════════════════════════════

    if (this.config.validation.strictUuidValidation && !isValidUuid(record.company_id)) {
      errors.push(`company_id no es UUID válido: ${record.company_id}`);
    }

    // ═══════════════════════════════════════════════════════════
    // UNIQUE constraints
    // ═══════════════════════════════════════════════════════════

    if (this.config.validation.checkDuplicates) {
      // UNIQUE: (company_id, bind_id)
      const duplicateBindId = allRecords.slice(0, index).find(
        r => r.company_id === record.company_id && r.bind_id === record.bind_id
      );
      if (duplicateBindId) {
        errors.push(`bind_id duplicado: ${record.bind_id}`);
      }

      // UNIQUE: (company_id, lower(sku))
      const duplicateSku = allRecords.slice(0, index).find(
        r => r.company_id === record.company_id &&
             r.sku.toLowerCase() === record.sku.toLowerCase()
      );
      if (duplicateSku) {
        errors.push(`sku duplicado (case-insensitive): ${record.sku}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Warnings (no bloquean)
    // ═══════════════════════════════════════════════════════════

    if (this.config.processing.showWarnings) {
      if (!record.description) {
        warnings.push('description es NULL');
      }

      if (!record.unit) {
        warnings.push('unit es NULL');
      }

      if (!record.category) {
        warnings.push('category es NULL');
      }

      if (record.stock === 0) {
        warnings.push('stock es 0 (sin inventario)');
      }

      if (record.price === 0) {
        warnings.push('price es 0');
      }

      if (record.sku === record.bind_id) {
        warnings.push('sku es igual a bind_id (se usó fallback)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida un registro de bind_mappings
   */
  validateBindMappings(record, allRecords, index) {
    const errors = [];
    const warnings = [];

    // NOT NULL
    if (!record.company_id) {
      errors.push('company_id es NULL');
    }

    if (!record.mapping_type) {
      errors.push('mapping_type es NULL');
    }

    if (!record.bind_id || record.bind_id.trim() === '') {
      errors.push('bind_id es NULL o vacío');
    }

    // mapping_type válido
    const validTypes = ['client', 'product', 'location', 'warehouse', 'branch', 'pricelist'];
    if (record.mapping_type && !validTypes.includes(record.mapping_type)) {
      errors.push(`mapping_type inválido: ${record.mapping_type}. Debe ser: ${validTypes.join(', ')}`);
    }

    // UUID válido
    if (this.config.validation.strictUuidValidation && !isValidUuid(record.company_id)) {
      errors.push(`company_id no es UUID válido: ${record.company_id}`);
    }

    // bind_data debe ser JSON válido (si no es null)
    if (record.bind_data && typeof record.bind_data === 'string') {
      try {
        JSON.parse(record.bind_data);
      } catch (e) {
        errors.push('bind_data no es JSON válido');
      }
    }

    // UNIQUE: (company_id, mapping_type, supabase_id) cuando supabase_id NOT NULL
    if (this.config.validation.checkDuplicates && record.supabase_id) {
      const duplicate = allRecords.slice(0, index).find(
        r => r.company_id === record.company_id &&
             r.mapping_type === record.mapping_type &&
             r.supabase_id === record.supabase_id
      );
      if (duplicate) {
        errors.push(`Mapping duplicado: (${record.mapping_type}, ${record.supabase_id})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Capitaliza la primera letra
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = Validator;
