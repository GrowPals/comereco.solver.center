
const IS_DEV = import.meta.env.DEV;

class Logger {
  constructor() {}

  error(message, error = null, context = {}) {
    if (IS_DEV) console.error(`[ERROR] ${message}`, error, context);
    // En producción, enviar a Sentry, etc.
  }

  warn(message, context = {}) {
    if (IS_DEV) console.warn(`[WARN] ${message}`, context);
  }

  info(message, context = {}) {
    if (IS_DEV) console.info(`[INFO] ${message}`, context);
  }

  debug(message, data = {}) {
    if (IS_DEV) console.log(`[DEBUG] ${message}`, data);
  }
}

const logger = new Logger();
export default logger;
