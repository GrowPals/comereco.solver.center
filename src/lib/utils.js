
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Genera un gradiente de avatar dinámico basado en el nombre del usuario
 * @param {string} name - Nombre del usuario
 * @returns {Object} - Objeto con colores del gradiente y sombra
 */
export function getAvatarGradient(name) {
	// Paleta de gradientes profesionales y vibrantes
	const gradients = [
		// Azul profundo
		{
			from: '#2F6BFF',
			via: '#2251D6',
			to: '#102565',
			shadow: 'rgba(35, 83, 200, 0.35)'
		},
		// Púrpura místico
		{
			from: '#A855F7',
			via: '#7C3AED',
			to: '#5B21B6',
			shadow: 'rgba(139, 92, 246, 0.35)'
		},
		// Rosa vibrante
		{
			from: '#EC4899',
			via: '#DB2777',
			to: '#9F1239',
			shadow: 'rgba(236, 72, 153, 0.35)'
		},
		// Naranja cálido
		{
			from: '#F97316',
			via: '#EA580C',
			to: '#C2410C',
			shadow: 'rgba(249, 115, 22, 0.35)'
		},
		// Verde esmeralda
		{
			from: '#10B981',
			via: '#059669',
			to: '#047857',
			shadow: 'rgba(16, 185, 129, 0.35)'
		},
		// Cian tropical
		{
			from: '#06B6D4',
			via: '#0891B2',
			to: '#0E7490',
			shadow: 'rgba(6, 182, 212, 0.35)'
		},
		// Índigo profundo
		{
			from: '#6366F1',
			via: '#4F46E5',
			to: '#3730A3',
			shadow: 'rgba(99, 102, 241, 0.35)'
		},
		// Rojo rubí
		{
			from: '#EF4444',
			via: '#DC2626',
			to: '#991B1B',
			shadow: 'rgba(239, 68, 68, 0.35)'
		},
		// Ámbar dorado
		{
			from: '#F59E0B',
			via: '#D97706',
			to: '#92400E',
			shadow: 'rgba(245, 158, 11, 0.35)'
		},
		// Teal oceánico
		{
			from: '#14B8A6',
			via: '#0D9488',
			to: '#115E59',
			shadow: 'rgba(20, 184, 166, 0.35)'
		},
		// Violeta real
		{
			from: '#8B5CF6',
			via: '#7C3AED',
			to: '#5B21B6',
			shadow: 'rgba(139, 92, 246, 0.35)'
		},
		// Lima energético
		{
			from: '#84CC16',
			via: '#65A30D',
			to: '#4D7C0F',
			shadow: 'rgba(132, 204, 22, 0.35)'
		}
	];

	// Generar un hash simple del nombre
	let hash = 0;
	const nameStr = (name || 'User').toString();
	for (let i = 0; i < nameStr.length; i++) {
		hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash; // Convertir a entero de 32 bits
	}

	// Seleccionar gradiente basado en el hash
	const index = Math.abs(hash) % gradients.length;
	return gradients[index];
}

/**
 * Obtiene las iniciales del nombre del usuario
 * @param {string} name - Nombre completo del usuario
 * @returns {string} - Iniciales (máximo 2 caracteres)
 */
export function getInitials(name) {
	if (!name) return 'U';

	const parts = name.trim().split(/\s+/);

	if (parts.length === 1) {
		// Si solo hay una palabra, retornar las primeras 2 letras
		return parts[0].substring(0, 2).toUpperCase();
	}

	// Si hay múltiples palabras, tomar la primera letra de las primeras 2 palabras
	return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}
