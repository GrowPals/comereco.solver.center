import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Componente para mostrar notificaciones de actualización PWA y estado offline
 */
export const PWAUpdatePrompt = () => {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [isOffline, setIsOffline] = useState(!navigator.onLine);
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		// Detectar estado offline/online
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Verificar actualizaciones del Service Worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				setUpdateAvailable(true);
			});

			// Verificar si hay una actualización pendiente
			navigator.serviceWorker.getRegistration().then(registration => {
				if (registration) {
					registration.addEventListener('updatefound', () => {
						setUpdateAvailable(true);
					});
				}
			});
		}

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	const handleUpdate = () => {
		if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
			window.location.reload();
		}
	};

	const handleDismiss = () => {
		setIsDismissed(true);
		setTimeout(() => setUpdateAvailable(false), 300);
	};

	if (isDismissed && !isOffline) return null;

	return (
		<>
			{/* Notificación de actualización disponible */}
			{updateAvailable && (
				<Card className={cn(
					'fixed bottom-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 transform shadow-lg transition-all duration-300',
					'border-2 border-primary-500 bg-card p-4',
					'animate-in slide-in-from-bottom-5'
				)}>
					<div className="flex items-center gap-3">
						<RefreshCw className="h-5 w-5 text-primary-500 animate-spin" />
						<div className="flex-1">
							<p className="font-semibold text-foreground">Nueva versión disponible</p>
							<p className="text-sm text-muted-foreground">Actualiza para obtener las últimas mejoras</p>
						</div>
						<div className="flex gap-2">
							<Button
								onClick={handleUpdate}
								size="sm"
								className="rounded-lg"
							>
								Actualizar
							</Button>
							<Button
								onClick={handleDismiss}
								variant="ghost"
								size="icon"
								className="h-8 w-8 rounded-lg"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</Card>
			)}

			{/* Notificación de estado offline */}
			{isOffline && (
				<Card className={cn(
					'fixed top-4 left-1/2 z-50 w-full max-w-md -translate-x-1/2 transform shadow-lg transition-all duration-300',
					'border-2 border-amber-500 bg-card p-3',
					'animate-in slide-in-from-top-5'
				)}>
					<div className="flex items-center gap-3">
						<WifiOff className="h-5 w-5 text-amber-500" />
						<div className="flex-1">
							<p className="font-semibold text-foreground">Modo offline</p>
							<p className="text-sm text-muted-foreground">Algunas funciones pueden estar limitadas</p>
						</div>
						<Button
							onClick={() => setIsOffline(false)}
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-lg"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</Card>
			)}
		</>
	);
};

export default PWAUpdatePrompt;

