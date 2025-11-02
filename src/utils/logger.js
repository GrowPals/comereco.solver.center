
/**
 * Logger Utility - ComerECO
 * Sistema centralizado de logging para desarrollo y producción
 *
 * En producción, los logs se pueden enviar a un servicio como Sentry o LogRocket
 */

const IS_PRODUCTION = import.meta.env.MODE === 'production';
const IS_DEV = import.meta.env.DEV;

/**
 * Niveles de log
 */
const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Logger principal
 */
class Logger {
  constructor() {
    this.isProduction = IS_PRODUCTION;
  }

  /**
   * Log de errores - siempre se registra
   */
  error(message, error = null, context = {}) {
    if (IS_DEV) {
      console.error(`[ERROR] ${message}`, error, context);
    }

    // TODO: En producción, enviar a servicio de logging (Sentry, LogRocket, etc)
    if (this.isProduction) {
      // Aquí se integraría con Sentry o similar
      // Sentry.captureException(error, { extra: { message, ...context } });
    }
  }

  /**
   * Log de advertencias - solo en desarrollo
   */
  warn(message, context = {}) {
    if (IS_DEV) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  /**
   * Log informativo - solo en desarrollo
   */
  info(message, context = {}) {
    if (IS_DEV) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log de depuración - solo en desarrollo
   */
  debug(message, data = {}) {
    if (IS_DEV) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  /**
   * Medir rendimiento de operaciones
   */
  time(label) {
    if (IS_DEV) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  }
}

// Instancia singleton
const logger = new Logger();

export default logger;
export { LogLevel };
