/**
 * EJEMPLOS DE USO DEL SISTEMA DE ALERTAS
 *
 * Este archivo contiene ejemplos de cómo utilizar el sistema de alertas
 * en diferentes escenarios dentro de la aplicación.
 */

import { useAlerts } from '@/context/AlertContext';
import { AlertBanner } from '@/components/AlertBanner';
import { useState } from 'react';

/**
 * MÉTODO 1: Usando el hook useAlerts para alertas globales
 * Este método es ideal para mostrar alertas desde cualquier componente
 */
export function ExampleWithGlobalAlerts() {
  const { addSuccessAlert, addErrorAlert, addWarningAlert, addInfoAlert } = useAlerts();

  const handleSaveSuccess = () => {
    // Alerta que se cierra automáticamente después de 3 segundos
    addSuccessAlert('Requisición guardada exitosamente.', 3000);
  };

  const handleSaveError = () => {
    // Alerta que permanece hasta que el usuario la cierre
    addErrorAlert('Error al guardar. Por favor intenta de nuevo.');
  };

  const handleWarning = () => {
    // Alerta de advertencia con duración de 5 segundos
    addWarningAlert('Tu sesión expirará en 5 minutos. Guarda tus cambios.', 5000);
  };

  const handleInfo = () => {
    // Alerta informativa
    addInfoAlert('Nueva versión disponible. Actualiza para obtener las últimas funciones.');
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Ejemplos de Alertas Globales</h2>
      <div className="flex gap-2">
        <button
          onClick={handleSaveSuccess}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Mostrar Success
        </button>
        <button
          onClick={handleSaveError}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Mostrar Error
        </button>
        <button
          onClick={handleWarning}
          className="rounded-lg bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
        >
          Mostrar Warning
        </button>
        <button
          onClick={handleInfo}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Mostrar Info
        </button>
      </div>
    </div>
  );
}

/**
 * MÉTODO 2: Usando el componente AlertBanner directamente (alertas locales)
 * Este método es útil para alertas específicas de una página o componente
 */
export function ExampleWithLocalAlerts() {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Ejemplos de Alertas Locales</h2>

      {/* Alertas locales */}
      {showSuccessAlert && (
        <AlertBanner
          type="success"
          message="Operación completada con éxito."
          onDismiss={() => setShowSuccessAlert(false)}
        />
      )}

      {showErrorAlert && (
        <AlertBanner
          type="error"
          message="Hubo un error al procesar tu solicitud."
          onDismiss={() => setShowErrorAlert(false)}
        />
      )}

      {/* Alerta persistente (no se puede cerrar) */}
      <AlertBanner
        type="warning"
        message="Sistema en mantenimiento programado este fin de semana."
        isDismissible={false}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowSuccessAlert(true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Mostrar Success Local
        </button>
        <button
          onClick={() => setShowErrorAlert(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Mostrar Error Local
        </button>
      </div>
    </div>
  );
}

/**
 * MÉTODO 3: Uso avanzado con addAlert
 */
export function ExampleWithAdvancedUsage() {
  const { addAlert } = useAlerts();

  const handleComplexAlert = () => {
    addAlert({
      type: 'info',
      message: 'Este es un mensaje más complejo con configuración personalizada.',
      duration: 10000, // 10 segundos
    });
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Uso Avanzado</h2>
      <button
        onClick={handleComplexAlert}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Alerta con Configuración Personalizada
      </button>
    </div>
  );
}

/**
 * EJEMPLO REAL: Formulario con validación y alertas
 */
export function RealWorldFormExample() {
  const { addSuccessAlert, addErrorAlert, addWarningAlert } = useAlerts();
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.name || !formData.email) {
      addWarningAlert('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      // Simulación de llamada a API
      // await api.submitForm(formData);

      addSuccessAlert('Formulario enviado exitosamente.', 3000);
      setFormData({ name: '', email: '' });
    } catch (error) {
      addErrorAlert('Error al enviar el formulario. Por favor intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">Ejemplo de Formulario</h2>

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Enviar Formulario
      </button>
    </form>
  );
}

/**
 * RESUMEN DE USO:
 *
 * 1. Para alertas globales (aparecen en la parte superior):
 *    - Importa: import { useAlerts } from '@/context/AlertContext';
 *    - Usa: const { addSuccessAlert, addErrorAlert, addWarningAlert, addInfoAlert } = useAlerts();
 *    - Llama: addSuccessAlert('Mensaje', duracionEnMs);
 *
 * 2. Para alertas locales en un componente específico:
 *    - Importa: import { AlertBanner } from '@/components/AlertBanner';
 *    - Usa: <AlertBanner type="success" message="Mensaje" onDismiss={() => {}} />
 *
 * 3. Tipos de alertas disponibles:
 *    - info: Información general (azul)
 *    - warning: Advertencias (amarillo)
 *    - error: Errores (rojo)
 *    - success: Confirmación exitosa (verde)
 *
 * 4. Parámetros opcionales:
 *    - duration: Tiempo en ms antes de auto-cerrar (solo para alertas globales)
 *    - isDismissible: true/false para permitir cerrar la alerta
 */
