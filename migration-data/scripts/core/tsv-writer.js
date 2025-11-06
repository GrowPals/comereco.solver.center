/**
 * ✍️ ESCRITOR DE ARCHIVOS TSV
 */

const fs = require('fs');
const path = require('path');

class TsvWriter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    // Resolve from scripts/ directory (parent of core/)
    this.outputPath = path.resolve(__dirname, '..', config.paths.processedTsv);

    // Asegurar que el directorio existe
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Escapa un valor para TSV
   * @param {*} value - Valor a escapar
   * @returns {string}
   */
  escapeValue(value) {
    if (value === null || value === undefined) {
      return '\\N'; // NULL en PostgreSQL
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object') {
      // Para JSONB, stringify
      return JSON.stringify(value)
        .replace(/\t/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, '');
    }

    // String: remover tabs, newlines
    return String(value)
      .replace(/\t/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  }

  /**
   * Convierte un registro a línea TSV
   * @param {object} record - Registro a convertir
   * @param {string[]} headers - Headers en orden
   * @returns {string}
   */
  recordToTsv(record, headers) {
    const values = headers.map(header => this.escapeValue(record[header]));
    return values.join('\t');
  }

  /**
   * Escribe un array de registros a TSV
   * @param {string} filename - Nombre del archivo
   * @param {object[]} records - Array de registros
   * @param {string[]} headers - Headers (opcional, se infiere del primer registro)
   * @returns {string} Ruta del archivo generado
   */
  write(filename, records, headers = null) {
    if (!records || records.length === 0) {
      this.logger.warn(`No hay registros para escribir en ${filename}`);
      return null;
    }

    // Inferir headers del primer registro si no se proporcionan
    if (!headers) {
      headers = Object.keys(records[0]);
    }

    const filepath = path.join(this.outputPath, filename);

    try {
      // Header row
      let tsv = headers.join('\t') + '\n';

      // Data rows
      for (const record of records) {
        tsv += this.recordToTsv(record, headers) + '\n';
      }

      fs.writeFileSync(filepath, tsv, 'utf-8');

      this.logger.success(`TSV generado: ${filename} (${records.length} registros)`);
      return filepath;
    } catch (error) {
      this.logger.error(`Error escribiendo ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Escribe registros a TSV usando streaming (para grandes volúmenes)
   * @param {string} filename - Nombre del archivo
   * @param {string[]} headers - Headers
   * @returns {object} Objeto con métodos write() y end()
   */
  createStream(filename, headers) {
    const filepath = path.join(this.outputPath, filename);
    const stream = fs.createWriteStream(filepath, { encoding: 'utf-8' });

    // Escribir header
    stream.write(headers.join('\t') + '\n');

    let count = 0;

    return {
      write: (record) => {
        const line = this.recordToTsv(record, headers) + '\n';
        stream.write(line);
        count++;
      },
      end: () => {
        return new Promise((resolve, reject) => {
          stream.end(() => {
            this.logger.success(`TSV generado: ${filename} (${count} registros)`);
            resolve(filepath);
          });
          stream.on('error', reject);
        });
      }
    };
  }

  /**
   * Escribe un SQL file
   * @param {string} filename - Nombre del archivo
   * @param {string} sql - Contenido SQL
   * @returns {string} Ruta del archivo generado
   */
  writeSQL(filename, sql) {
    const filepath = path.join(this.outputPath, filename);

    try {
      fs.writeFileSync(filepath, sql, 'utf-8');
      this.logger.success(`SQL generado: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Error escribiendo ${filename}:`, error.message);
      return null;
    }
  }
}

module.exports = TsvWriter;
