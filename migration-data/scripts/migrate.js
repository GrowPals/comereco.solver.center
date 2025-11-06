#!/usr/bin/env node

/**
 * 🚀 SCRIPT PRINCIPAL DE MIGRACIÓN
 *
 * Ejecuta la migración de datos de Bind ERP a Supabase
 */

const config = require('./config');
const Logger = require('./core/logger');
const FileReader = require('./core/file-reader');
const TsvWriter = require('./core/tsv-writer');
const Validator = require('./core/validator');
const { getAllProcessors, getProcessor, getProcessorNames } = require('./processors');

// ═══════════════════════════════════════════════════════════════
// PARSE ARGUMENTS
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const flags = {
  verbose: args.includes('--verbose'),
  dryRun: args.includes('--dry-run'),
  only: null
};

const onlyFlag = args.find(arg => arg.startsWith('--only='));
if (onlyFlag) {
  flags.only = onlyFlag.split('=')[1];
}

// Ajustar nivel de logging si verbose
if (flags.verbose) {
  config.logging.level = 'debug';
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZAR SISTEMA
// ═══════════════════════════════════════════════════════════════

const logger = new Logger(config);
const fileReader = new FileReader(config, logger);
const tsvWriter = new TsvWriter(config, logger);
const validator = new Validator(config, logger);

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function main() {
  try {
    // ─────────────────────────────────────────────────────────────
    // HEADER
    // ─────────────────────────────────────────────────────────────

    logger.section('🚀 MIGRACIÓN BIND ERP → SUPABASE');
    logger.info(`Fecha: ${new Date().toISOString()}`);
    logger.info(`Company ID: ${config.companyId}`);

    if (flags.dryRun) {
      logger.warn('⚠️  MODO DRY-RUN: No se generarán archivos TSV');
    }

    if (flags.only) {
      logger.info(`📌 Solo procesador: ${flags.only}`);
    }

    // ─────────────────────────────────────────────────────────────
    // VALIDAR CONFIGURACIÓN
    // ─────────────────────────────────────────────────────────────

    logger.subsection('Validando configuración');

    if (config.companyId === '00000000-0000-0000-0000-000000000000') {
      logger.failure('company_id no configurado en config.js');
      logger.info('Edita scripts/config.js y actualiza el companyId');
      process.exit(1);
    }

    logger.success('Configuración válida');

    // ─────────────────────────────────────────────────────────────
    // ESCANEAR ARCHIVOS
    // ─────────────────────────────────────────────────────────────

    logger.subsection('Escaneando archivos en 01-raw-bind-data/');

    const files = fileReader.listFiles();

    if (files.length === 0) {
      logger.failure('No se encontraron archivos JSON en 01-raw-bind-data/');
      logger.info('Pega los outputs de tus GETs en esa carpeta');
      process.exit(1);
    }

    for (const file of files) {
      const size = fileReader.getFileSize(file);
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      logger.info(`   ✅ ${file} (${sizeMB} MB)`);
    }

    // ─────────────────────────────────────────────────────────────
    // DETERMINAR QUÉ PROCESADORES EJECUTAR
    // ─────────────────────────────────────────────────────────────

    let processorsToRun = getAllProcessors();

    if (flags.only) {
      const processor = getProcessor(flags.only);
      if (!processor) {
        logger.failure(`Procesador no encontrado: ${flags.only}`);
        logger.info(`Procesadores disponibles: ${getProcessorNames().join(', ')}`);
        process.exit(1);
      }
      processorsToRun = [processor];
    }

    // ─────────────────────────────────────────────────────────────
    // PROCESAR CADA ENTIDAD
    // ─────────────────────────────────────────────────────────────

    const stats = {
      totalProcessed: 0,
      totalSkipped: 0,
      totalErrors: 0,
      byProcessor: {}
    };

    for (const processor of processorsToRun) {
      await processEntity(processor, stats);
    }

    // ─────────────────────────────────────────────────────────────
    // RESUMEN FINAL
    // ─────────────────────────────────────────────────────────────

    logger.summary({
      'Total procesado': stats.totalProcessed,
      'Total omitidos': stats.totalSkipped,
      'Total errores': stats.totalErrors,
      'Archivos generados': Object.keys(stats.byProcessor).length
    });

    logger.info('');
    logger.success('✅ MIGRACIÓN COMPLETADA');
    logger.info('');
    logger.info('📝 SIGUIENTE PASO:');
    logger.info('   1. Revisar TSVs en: 02-processed-tsv/');
    logger.info('   2. Importar a Supabase Table Editor');
    logger.info('   3. Si hay SQL files, ejecutarlos en SQL Editor');

  } catch (error) {
    logger.failure('Error fatal:');
    logger.error(error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// PROCESAR UNA ENTIDAD
// ═══════════════════════════════════════════════════════════════

async function processEntity(processor, stats) {
  logger.section(`🔨 PROCESANDO: ${processor.name.toUpperCase()}`);
  logger.info(`Descripción: ${processor.description}`);

  const processorStats = {
    processed: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. Verificar archivo primario
    // ─────────────────────────────────────────────────────────────

    if (!fileReader.exists(processor.sources.primary)) {
      logger.warn(`⚠️  Archivo no encontrado: ${processor.sources.primary}`);
      logger.info(`   Saltando procesador ${processor.name}`);
      return;
    }

    logger.info(`📖 Leyendo: ${processor.sources.primary}`);

    // ─────────────────────────────────────────────────────────────
    // 2. Preparar enrichment
    // ─────────────────────────────────────────────────────────────

    const context = {
      companyId: config.companyId,
      warehouseId: config.bind.warehouseId,
      priceListId: config.bind.priceListId,
      fileReader,
      logger,
      tsvWriter,
      validator,
      config
    };

    let enrichment = null;
    if (processor.prepareEnrichment) {
      logger.subsection('Preparando enrichment...');
      enrichment = await processor.prepareEnrichment(context);
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Leer datos primarios
    // ─────────────────────────────────────────────────────────────

    const primaryData = fileReader.readOptional(processor.sources.primary);

    if (primaryData.length === 0) {
      logger.warn(`   No hay datos en ${processor.sources.primary}`);
      return;
    }

    logger.info(`   Registros encontrados: ${primaryData.length}`);

    // ─────────────────────────────────────────────────────────────
    // 4. Transformar cada registro
    // ─────────────────────────────────────────────────────────────

    logger.subsection('Transformando registros...');

    const records = [];
    const progressInterval = config.logging.progressInterval;

    for (let i = 0; i < primaryData.length; i++) {
      const sourceRecord = primaryData[i];

      try {
        // Transformar
        const result = processor.transform(sourceRecord, context, enrichment);

        if (result.skip) {
          processorStats.skipped++;
          logger.debug(`   [${i + 1}] Omitido: ${result.reason}`);
          continue;
        }

        // Validar
        const validation = validator.validate(processor.name, result.record, records, records.length);

        if (!validation.valid) {
          processorStats.errors++;
          logger.error(`   [${i + 1}] Errores de validación:`);
          validation.errors.forEach(err => logger.error(`      - ${err}`));

          if (!config.processing.continueOnError) {
            throw new Error('Validación falló. Detener procesamiento.');
          }
          continue;
        }

        // Mostrar warnings
        if (validation.warnings.length > 0 && config.processing.showWarnings) {
          validation.warnings.forEach(warn => logger.debug(`      ⚠️  ${warn}`));
        }

        records.push(result.record);
        processorStats.processed++;

        // Progress
        if (i > 0 && i % progressInterval === 0) {
          logger.progress(i, primaryData.length, result.record.name || result.record.bind_id);
        }

      } catch (error) {
        processorStats.errors++;
        logger.error(`   [${i + 1}] Error procesando registro:`, error.message);

        if (!config.processing.continueOnError) {
          throw error;
        }
      }
    }

    logger.progress(primaryData.length, primaryData.length, 'Completado');

    // ─────────────────────────────────────────────────────────────
    // 5. Generar TSV
    // ─────────────────────────────────────────────────────────────

    if (records.length === 0) {
      logger.warn(`   No hay registros válidos para ${processor.name}`);
      return;
    }

    logger.subsection('Generando TSV...');

    if (!flags.dryRun) {
      const tsvPath = tsvWriter.write(
        processor.target.tsv,
        records,
        processor.target.headers
      );

      if (tsvPath) {
        logger.success(`   TSV: ${processor.target.tsv}`);
      }
    } else {
      logger.info(`   [DRY-RUN] TSV no generado: ${processor.target.tsv}`);
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Post-procesamiento (SQL, etc.)
    // ─────────────────────────────────────────────────────────────

    if (processor.postProcess && !flags.dryRun) {
      logger.subsection('Post-procesamiento...');
      await processor.postProcess(records, context);
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Actualizar stats
    // ─────────────────────────────────────────────────────────────

    stats.totalProcessed += processorStats.processed;
    stats.totalSkipped += processorStats.skipped;
    stats.totalErrors += processorStats.errors;
    stats.byProcessor[processor.name] = processorStats;

    logger.subsection('Resumen');
    logger.info(`   Procesados: ${processorStats.processed}`);
    logger.info(`   Omitidos: ${processorStats.skipped}`);
    logger.info(`   Errores: ${processorStats.errors}`);

  } catch (error) {
    logger.failure(`Error en procesador ${processor.name}:`);
    logger.error(error.stack);
    stats.totalErrors++;
  }
}

// ═══════════════════════════════════════════════════════════════
// EJECUTAR
// ═══════════════════════════════════════════════════════════════

main();
