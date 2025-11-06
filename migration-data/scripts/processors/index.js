/**
 * 📦 REGISTRY DE PROCESADORES
 */

const products = require('./products');

// Solo productos - sistema optimizado para migración simple
const processors = [products];

// Ordenar por prioridad
processors.sort((a, b) => a.priority - b.priority);

/**
 * Obtiene un procesador por nombre
 * @param {string} name - Nombre del procesador
 * @returns {object|null}
 */
function getProcessor(name) {
  return processors.find(p => p.name === name) || null;
}

/**
 * Obtiene todos los procesadores
 * @returns {object[]}
 */
function getAllProcessors() {
  return processors;
}

/**
 * Obtiene nombres de todos los procesadores
 * @returns {string[]}
 */
function getProcessorNames() {
  return processors.map(p => p.name);
}

module.exports = {
  processors,
  getProcessor,
  getAllProcessors,
  getProcessorNames
};
