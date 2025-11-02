
import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debouncing.
 * Retrasa la actualización de un valor hasta que ha pasado un tiempo determinado sin cambios.
 * @param {*} value - El valor a "deboucear".
 * @param {number} delay - El tiempo de retraso en milisegundos.
 * @returns {*} El valor "debounced".
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configura un temporizador para actualizar el valor debounced después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpia el temporizador si el valor cambia (o si el componente se desmonta)
    // Esto es lo que evita que el valor se actualice mientras el usuario sigue escribiendo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el delay cambian

  return debouncedValue;
}
