import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { registerSW } from 'virtual:pwa-register';

// Verificación de seguridad: asegurar que React esté disponible
if (!React || !ReactDOM) {
	throw new Error('React no está disponible. Verifica que las dependencias estén correctamente instaladas.');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Elemento root no encontrado en el DOM');
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ErrorBoundary>
			<HelmetProvider>
				<App />
			</HelmetProvider>
		</ErrorBoundary>
	</React.StrictMode>
);

// Enable Vercel Speed Insights only in production
if (import.meta.env.PROD) {
	injectSpeedInsights();

	// Registrar Service Worker con manejo mejorado de actualizaciones
	const updateSW = registerSW({
		immediate: true,
		onRegistered(registration) {
			if (registration) {
				console.log('✅ Service Worker registrado correctamente');
				
				// Verificar actualizaciones cada hora
				if (registration.update) {
					setInterval(() => {
						registration.update().catch(err => {
							console.warn('Error al verificar actualizaciones:', err);
						});
					}, 60 * 60 * 1000); // Cada hora
				}
				
				// Escuchar eventos de actualización
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// Nueva versión disponible
								console.log('🔄 Nueva versión disponible. Recargando...');
								// Mostrar notificación al usuario (opcional)
								if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar ahora?')) {
									updateSW(true);
								}
							}
						});
					}
				});
			}
		},
		onRegisterError(error) {
			console.error('❌ Error al registrar Service Worker:', error);
		},
		onNeedRefresh() {
			// Cuando se detecta una nueva versión
			console.log('🔄 Nueva versión disponible');
			if (window.confirm('Hay una nueva versión disponible. ¿Deseas actualizar ahora?')) {
				updateSW(true);
			}
		},
		onOfflineReady() {
			console.log('✅ App lista para funcionar offline');
		},
	});
	
	// Manejar eventos de conexión
	window.addEventListener('online', () => {
		console.log('🌐 Conexión restaurada');
		// Opcional: mostrar notificación al usuario
	});
	
	window.addEventListener('offline', () => {
		console.log('📴 Modo offline activado');
		// Opcional: mostrar notificación al usuario
	});
}
