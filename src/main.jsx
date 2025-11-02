import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import ErrorBoundary from '@/components/ErrorBoundary';
import './index.css';
import { injectSpeedInsights } from '@vercel/speed-insights';

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
			<App />
		</ErrorBoundary>
	</React.StrictMode>
);

// Enable Vercel Speed Insights only in production
if (import.meta.env.PROD) {
	injectSpeedInsights();
}
