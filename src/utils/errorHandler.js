/**
 * Error Handler Utility
 * Sistema centralizado para manejo de errores con contexto
 */
export const getErrorContext = (error) => {
  if (!error) return null;

  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';

  // Errores de autenticación
  if (errorMessage.includes('session') || errorMessage.includes('Sesión no válida') || errorCode === 'PGRST301') {
    return {
      type: 'auth',
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      action: { 
        label: 'Iniciar sesión', 
        path: '/login' 
      },
      retryable: false
    };
  }

  // Errores de red
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorCode === 'ECONNABORTED' || errorCode === 'ENOTFOUND') {
    return {
      type: 'network',
      message: 'Problema de conexión. Verifica tu internet e intenta de nuevo.',
      action: { 
        label: 'Reintentar', 
        fn: 'retry' 
      },
      retryable: true
    };
  }

  // Errores de permisos
  if (errorMessage.includes('permiso') || errorMessage.includes('permission') || errorCode === 'PGRST301') {
    return {
      type: 'permission',
      message: 'No tienes permisos para realizar esta acción.',
      action: null,
      retryable: false
    };
  }

  // Errores de validación
  if (errorMessage.includes('required') || errorMessage.includes('invalid') || errorMessage.includes('validation')) {
    return {
      type: 'validation',
      message: errorMessage || 'Los datos proporcionados no son válidos.',
      action: null,
      retryable: false
    };
  }

  // Errores de servidor
  if (errorCode?.startsWith('5') || errorMessage.includes('server') || errorMessage.includes('Server Error')) {
    return {
      type: 'server',
      message: 'Error del servidor. Por favor, intenta más tarde o contacta al soporte.',
      action: null,
      retryable: true
    };
  }

  // Error genérico
  return {
    type: 'unknown',
    message: errorMessage || 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.',
    action: { 
      label: 'Reintentar', 
      fn: 'retry' 
    },
    retryable: true
  };
};

/**
 * Retry logic con exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorContext = getErrorContext(error);
      
      // No retry si no es retryable
      if (!errorContext?.retryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Helper para formatear mensajes de error para el usuario
 */
export const formatErrorMessage = (error) => {
  const context = getErrorContext(error);
  return context?.message || 'Ha ocurrido un error. Por favor, intenta de nuevo.';
};

