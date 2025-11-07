import { useAlerts } from '@/context/AlertContext';
import { AlertBanner } from '@/components/AlertBanner';

/**
 * AlertContainer - Contenedor para mostrar alertas globales
 * Renderiza todas las alertas activas en la zona superior de la aplicación
 */
export function AlertContainer() {
  const { alerts, removeAlert } = useAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-3">
        {alerts.map((alert) => (
          <AlertBanner
            key={alert.id}
            type={alert.type}
            message={alert.message}
            onDismiss={() => removeAlert(alert.id)}
            isDismissible={true}
          />
        ))}
      </div>
    </div>
  );
}
