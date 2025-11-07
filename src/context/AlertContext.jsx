import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const AlertContext = createContext(null);

/**
 * AlertProvider - Proveedor de contexto para gestionar alertas globales
 * Permite agregar, remover y gestionar alertas en toda la aplicación
 */
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  /**
   * Remueve una alerta por su ID
   * @param {string} id - ID de la alerta a remover
   */
  const removeAlert = useCallback((id) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
  }, []);

  /**
   * Agrega una nueva alerta al sistema
   * @param {Object} alert - Configuración de la alerta
   * @param {string} alert.type - Tipo de alerta: 'info' | 'warning' | 'error' | 'success'
   * @param {string} alert.message - Mensaje a mostrar
   * @param {number} [alert.duration] - Duración en ms antes de auto-cerrar (opcional)
   */
  const addAlert = useCallback((alert) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newAlert = { ...alert, id };

    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);

    // Auto-dismiss si tiene duration
    if (alert.duration) {
      setTimeout(() => {
        removeAlert(id);
      }, alert.duration);
    }

    return id;
  }, [removeAlert]);

  /**
   * Limpia todas las alertas
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Métodos de conveniencia para agregar alertas de cada tipo
   */
  const addInfoAlert = useCallback((message, duration) => {
    return addAlert({ type: 'info', message, duration });
  }, [addAlert]);

  const addWarningAlert = useCallback((message, duration) => {
    return addAlert({ type: 'warning', message, duration });
  }, [addAlert]);

  const addErrorAlert = useCallback((message, duration) => {
    return addAlert({ type: 'error', message, duration });
  }, [addAlert]);

  const addSuccessAlert = useCallback((message, duration) => {
    return addAlert({ type: 'success', message, duration });
  }, [addAlert]);

  const value = useMemo(() => ({
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    addInfoAlert,
    addWarningAlert,
    addErrorAlert,
    addSuccessAlert,
  }), [
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    addInfoAlert,
    addWarningAlert,
    addErrorAlert,
    addSuccessAlert,
  ]);

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

/**
 * Hook para usar el contexto de alertas
 * @returns {Object} Objeto con métodos y estado para gestionar alertas
 */
export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
