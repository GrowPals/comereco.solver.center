import React from 'react';
import { useAlerts } from '@/context/AlertContext';
import { AlertBanner } from '@/components/AlertBanner';

/**
 * AlertContainer - Contenedor para mostrar alertas globales
 * Renderiza todas las alertas activas debajo del header
 * No usa positioning sticky para evitar sobreposición con el header sticky
 */
export function AlertContainer() {
  const { alerts, removeAlert } = useAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="relative z-30 px-4 pb-4 sm:px-6 lg:px-8">
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
