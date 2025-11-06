/**
 * 📖 LECTOR DE ARCHIVOS JSON CON SOPORTE DE STREAMING
 */

const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');

class FileReader {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    // Resolve from scripts/ directory (parent of core/)
    this.rawDataPath = path.resolve(__dirname, '..', config.paths.rawData);
  }

  /**
   * Verifica si un archivo existe
   * @param {string} filename - Nombre del archivo
   * @returns {boolean}
   */
  exists(filename) {
    const filepath = path.join(this.rawDataPath, filename);
    return fs.existsSync(filepath);
  }

  /**
   * Obtiene el tamaño de un archivo en bytes
   * @param {string} filename - Nombre del archivo
   * @returns {number}
   */
  getFileSize(filename) {
    if (!this.exists(filename)) {
      return 0;
    }

    const filepath = path.join(this.rawDataPath, filename);
    const stats = fs.statSync(filepath);
    return stats.size;
  }

  /**
   * Lee un archivo JSON completo (para archivos pequeños)
   * @param {string} filename - Nombre del archivo
   * @returns {object|null}
   */
  readSync(filename) {
    if (!this.exists(filename)) {
      this.logger.warn(`Archivo no encontrado: ${filename}`);
      return null;
    }

    try {
      const filepath = path.join(this.rawDataPath, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(`Error leyendo ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Extrae el array de datos de un JSON (maneja formato OData)
   * @param {object} json - Objeto JSON
   * @returns {array}
   */
  extractArray(json) {
    if (!json) return [];

    // Formato OData: { "value": [...] }
    if (json.value && Array.isArray(json.value)) {
      return json.value;
    }

    // Formato alternativo: { "data": [...] }
    if (json.data && Array.isArray(json.data)) {
      return json.data;
    }

    // Si ya es array
    if (Array.isArray(json)) {
      // Si es un array que contiene un objeto con "value", extraerlo
      // Ejemplo: [{ "value": [...] }] → retorna [...]
      if (json.length > 0 && json[0].value && Array.isArray(json[0].value)) {
        return json[0].value;
      }
      return json;
    }

    // Si es objeto único, envolver en array
    return [json];
  }

  /**
   * Lee un archivo con streaming (para archivos grandes)
   * @param {string} filename - Nombre del archivo
   * @param {function} onData - Callback para cada registro
   * @param {string} arrayPath - Ruta JSONPath (default: 'value.*' para OData)
   * @returns {Promise<number>} Número de registros procesados
   */
  async readStream(filename, onData, arrayPath = 'value.*') {
    if (!this.exists(filename)) {
      this.logger.warn(`Archivo no encontrado: ${filename}`);
      return 0;
    }

    return new Promise((resolve, reject) => {
      const filepath = path.join(this.rawDataPath, filename);
      let count = 0;
      let hasError = false;

      const stream = fs.createReadStream(filepath, { encoding: 'utf-8' })
        .pipe(JSONStream.parse(arrayPath));

      stream.on('data', (data) => {
        try {
          onData(data, count);
          count++;
        } catch (error) {
          this.logger.error(`Error procesando registro ${count}:`, error.message);
          if (!this.config.processing.continueOnError) {
            hasError = true;
            stream.destroy();
          }
        }
      });

      stream.on('end', () => {
        if (!hasError) {
          resolve(count);
        }
      });

      stream.on('error', (error) => {
        this.logger.error(`Error en stream de ${filename}:`, error.message);
        reject(error);
      });
    });
  }

  /**
   * Lee un archivo (automáticamente elige sync o stream según tamaño)
   * @param {string} filename - Nombre del archivo
   * @param {function} onData - Callback para cada registro (opcional, solo para streaming)
   * @returns {Promise<array|number>} Array de datos o número de registros procesados
   */
  async read(filename, onData = null) {
    const fileSize = this.getFileSize(filename);
    const useStreaming = this.config.processing.useStreaming && fileSize > 5 * 1024 * 1024; // 5MB

    if (useStreaming && onData) {
      this.logger.debug(`Usando streaming para ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      const count = await this.readStream(filename, onData);
      return count;
    } else {
      const json = this.readSync(filename);
      return this.extractArray(json);
    }
  }

  /**
   * Lee un archivo opcional (no lanza error si no existe)
   * @param {string} filename - Nombre del archivo
   * @returns {array}
   */
  readOptional(filename) {
    if (!this.exists(filename)) {
      return [];
    }

    const json = this.readSync(filename);
    return this.extractArray(json);
  }

  /**
   * Lista todos los archivos JSON en rawData
   * @returns {string[]}
   */
  listFiles() {
    if (!fs.existsSync(this.rawDataPath)) {
      return [];
    }

    return fs.readdirSync(this.rawDataPath)
      .filter(file => file.endsWith('.json'));
  }
}

module.exports = FileReader;
