import logger from '@/utils/logger';

/**
 * Configuración por defecto para retry logic
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2, // exponencial
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Códigos HTTP reintentoables
  retryableErrors: [
    'fetch failed',
    'network',
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND'
  ]
};

/**
 * Determina si un error es reintentoable
 * @param {Error|Object} error - Error a evaluar
 * @param {Array<number>} retryableStatuses - Códigos HTTP reintentoables
 * @param {Array<string>} retryableErrors - Palabras clave de errores reintentoables
 * @returns {boolean}
 */
const isRetryableError = (error, retryableStatuses, retryableErrors) => {
  // Si es un error de Supabase Edge Function
  if (error?.status && retryableStatuses.includes(error.status)) {
    return true;
  }

  // Si es un error de Supabase con contexto
  if (error?.context?.status && retryableStatuses.includes(error.context.status)) {
    return true;
  }

  // Verificar mensaje de error
  const errorMessage = error?.message?.toLowerCase() || '';
  return retryableErrors.some(keyword => errorMessage.includes(keyword.toLowerCase()));
};

/**
 * Calcula el delay para el próximo reintento usando backoff exponencial
 * @param {number} attempt - Número de intento actual (0-indexed)
 * @param {number} initialDelay - Delay inicial en ms
 * @param {number} maxDelay - Delay máximo en ms
 * @param {number} backoffMultiplier - Multiplicador para backoff exponencial
 * @returns {number} Delay en ms con jitter aleatorio
 */
const calculateDelay = (attempt, initialDelay, maxDelay, backoffMultiplier) => {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Agregar jitter aleatorio (±20%) para evitar thundering herd
  const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);

  return Math.floor(cappedDelay + jitter);
};

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta una función con retry logic usando backoff exponencial
 *
 * @template T
 * @param {() => Promise<T>} fn - Función asíncrona a ejecutar
 * @param {Object} [options] - Opciones de configuración
 * @param {number} [options.maxRetries=3] - Número máximo de reintentos
 * @param {number} [options.initialDelay=1000] - Delay inicial en ms
 * @param {number} [options.maxDelay=10000] - Delay máximo en ms
 * @param {number} [options.backoffMultiplier=2] - Multiplicador para backoff exponencial
 * @param {Array<number>} [options.retryableStatuses] - Códigos HTTP reintentoables
 * @param {Array<string>} [options.retryableErrors] - Palabras clave de errores reintentoables
 * @param {(error: Error, attempt: number) => boolean} [options.shouldRetry] - Función personalizada para determinar si reintentar
 * @param {(error: Error, attempt: number, delay: number) => void} [options.onRetry] - Callback al reintentar
 * @param {string} [options.operationName] - Nombre de la operación (para logs)
 * @returns {Promise<T>} Resultado de la función
 * @throws {Error} El último error si todos los reintentos fallan
 *
 * @example
 * const result = await withRetry(
 *   () => supabase.functions.invoke('my-function'),
 *   { maxRetries: 3, operationName: 'invoke-my-function' }
 * );
 */
export const withRetry = async (fn, options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    retryableStatuses,
    retryableErrors,
    shouldRetry,
    onRetry,
    operationName = 'operation'
  } = config;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Ejecutar la función
      const result = await fn();

      // Si es el primer intento exitoso después de fallos, loguearlo
      if (attempt > 0) {
        logger.info(`${operationName} succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        logger.error(`${operationName} failed after ${maxRetries} retries:`, error);
        throw error;
      }

      // Determinar si debemos reintentar
      const shouldRetryError = shouldRetry
        ? shouldRetry(error, attempt)
        : isRetryableError(error, retryableStatuses, retryableErrors);

      if (!shouldRetryError) {
        logger.warn(`${operationName} failed with non-retryable error:`, error);
        throw error;
      }

      // Calcular delay para el próximo intento
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
        `Retrying in ${delay}ms...`,
        { error: error.message }
      );

      // Ejecutar callback de retry si existe
      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      // Esperar antes del próximo intento
      await sleep(delay);
    }
  }

  // Esto no debería alcanzarse, pero por seguridad
  throw lastError;
};

/**
 * Wrapper específico para Edge Functions de Supabase
 *
 * @template T
 * @param {() => Promise<T>} fn - Función que invoca la Edge Function
 * @param {Object} [options] - Opciones adicionales
 * @param {string} options.functionName - Nombre de la Edge Function
 * @returns {Promise<T>}
 *
 * @example
 * const result = await retryEdgeFunction(
 *   () => supabase.functions.invoke('invite-user', { body: data }),
 *   { functionName: 'invite-user' }
 * );
 */
export const retryEdgeFunction = async (fn, options = {}) => {
  const { functionName = 'edge-function', ...restOptions } = options;

  return withRetry(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 8000,
    operationName: `Edge Function: ${functionName}`,
    ...restOptions
  });
};

/**
 * Wrapper específico para queries de Supabase
 *
 * @template T
 * @param {() => Promise<T>} fn - Función que ejecuta la query
 * @param {Object} [options] - Opciones adicionales
 * @param {string} options.queryName - Nombre de la query
 * @returns {Promise<T>}
 *
 * @example
 * const result = await retrySupabaseQuery(
 *   () => supabase.from('products').select('*'),
 *   { queryName: 'fetch-products' }
 * );
 */
export const retrySupabaseQuery = async (fn, options = {}) => {
  const { queryName = 'supabase-query', ...restOptions } = options;

  return withRetry(fn, {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 3000,
    operationName: `Supabase Query: ${queryName}`,
    ...restOptions
  });
};

export default withRetry;
