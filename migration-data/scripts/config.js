/**
 * ⚙️ CONFIGURACIÓN DE MIGRACIÓN
 *
 * ⚠️ IMPORTANTE: Edita este archivo antes de ejecutar la migración
 */

module.exports = {
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURACIÓN PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Company ID de Supabase
   * ⚠️ REQUERIDO: Obtén tu UUID ejecutando:
   *    SELECT id, name FROM companies;
   */
  companyId: '2ea0aa65-6319-415e-a153-31c9804c352f', // ⚠️ CAMBIAR


  // ═══════════════════════════════════════════════════════════════
  // RUTAS DE ARCHIVOS
  // ═══════════════════════════════════════════════════════════════

  paths: {
    rawData: '../01-raw-bind-data',
    processedTsv: '../02-processed-tsv',
    logs: '../03-logs'
  },

  // ═══════════════════════════════════════════════════════════════
  // FILTROS OPCIONALES
  // ═══════════════════════════════════════════════════════════════

  filters: {
    products: {
      // Incluir solo productos activos (IsActive = true)
      activeOnly: false,

      // Stock mínimo para considerar (0 = todos)
      minStock: 0,

      // Precio mínimo (0 = todos)
      minPrice: 0,

      // Incluir servicios (Type = 2)
      includeServices: true
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // OPCIONES DE PROCESAMIENTO
  // ═══════════════════════════════════════════════════════════════

  processing: {
    // Usar streaming para archivos grandes (> 5MB)
    useStreaming: true,

    // Tamaño de chunk para procesamiento (registros)
    chunkSize: 1000,

    // Continuar si hay errores (skip registros con error)
    continueOnError: true,

    // Mostrar warnings (campos opcionales faltantes)
    showWarnings: true
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════════════════════════

  validation: {
    // Validar UUIDs estrictamente
    strictUuidValidation: true,

    // Validar unicidad de sku/bind_id
    checkDuplicates: true,

    // Máxima longitud de strings (truncar si excede)
    maxStringLength: 1000
  },

  // ═══════════════════════════════════════════════════════════════
  // LOGGING
  // ═══════════════════════════════════════════════════════════════

  logging: {
    // Nivel de logging: 'error' | 'warn' | 'info' | 'debug'
    level: 'info',

    // Guardar logs en archivo
    saveToFile: true,

    // Mostrar progreso cada N registros
    progressInterval: 100
  }
};
