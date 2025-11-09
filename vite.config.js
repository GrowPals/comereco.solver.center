import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';

const isDev = process.env.NODE_ENV !== 'production';

const configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;

const configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;

const configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;

const configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/\.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;

const configNavigationHandler = `
if (window.navigation && window.self !== window.top) {
	window.navigation.addEventListener('navigate', (event) => {
		const url = event.destination.url;

		try {
			const destinationUrl = new URL(url);
			const destinationOrigin = destinationUrl.origin;
			const currentOrigin = window.location.origin;

			if (destinationOrigin === currentOrigin) {
				return;
			}
		} catch (error) {
			return;
		}

		window.parent.postMessage({
			type: 'horizons-navigation-error',
			url,
		}, '*');
	});
}
`;

const addTransformIndexHtml = {
	name: 'add-transform-index-html',
	transformIndexHtml(html) {
		const tags = [
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsRuntimeErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configHorizonsViteErrorHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: {type: 'module'},
				children: configHorizonsConsoleErrroHandler,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configWindowFetchMonkeyPatch,
				injectTo: 'head',
			},
			{
				tag: 'script',
				attrs: { type: 'module' },
				children: configNavigationHandler,
				injectTo: 'head',
			},
		];

		if (!isDev && process.env.TEMPLATE_BANNER_SCRIPT_URL && process.env.TEMPLATE_REDIRECT_URL) {
			tags.push(
				{
					tag: 'script',
					attrs: {
						src: process.env.TEMPLATE_BANNER_SCRIPT_URL,
						'template-redirect-url': process.env.TEMPLATE_REDIRECT_URL,
					},
					injectTo: 'head',
				}
			);
		}

		return {
			html,
			tags,
		};
	},
};

console.warn = () => {};

const logger = createLogger()
const loggerError = logger.error

logger.error = (msg, options) => {
	if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
		return;
	}

	loggerError(msg, options);
}

export default defineConfig({
	customLogger: logger,
	plugins: [
		...(isDev ? [inlineEditPlugin(), editModeDevPlugin(), iframeRouteRestorationPlugin()] : []),
		react({
			jsxRuntime: 'automatic',
			jsxImportSource: 'react',
			babel: {
				plugins: [],
				presets: [],
			},
		}),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: [
				'logo.png',
				'pwa-icon-192.png',
				'pwa-icon-512.png',
				'placeholder.svg',
				'placeholder-dark.svg',
				'robots.txt',
				'sitemap.xml',
				'browserconfig.xml',
				'offline.html'
			],
			manifest: {
				name: 'ComerECO - Sistema de Requisiciones',
				short_name: 'ComerECO',
				description: 'Sistema web interno para la gestión de requisiciones y compras del Grupo Solven. Gestiona pedidos, aprobaciones y catálogo de productos desde cualquier dispositivo.',
				theme_color: '#10b981',
				background_color: '#050816',
				display: 'standalone',
				orientation: 'portrait-primary',
				lang: 'es-MX',
				dir: 'ltr',
				scope: '/',
				start_url: '/',
				categories: ['productivity', 'business', 'finance'],
				icons: [
					{
						src: '/pwa-icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/pwa-icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				shortcuts: [
					{
						name: 'Nueva Requisición',
						short_name: 'Nueva',
						description: 'Crear una nueva requisición de compra',
						url: '/requisitions/new',
						icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
					},
					{
						name: 'Catálogo',
						short_name: 'Catálogo',
						description: 'Explorar catálogo de productos',
						url: '/catalog',
						icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
					},
					{
						name: 'Aprobaciones',
						short_name: 'Aprobar',
						description: 'Revisar aprobaciones pendientes',
						url: '/approvals',
						icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
					},
					{
						name: 'Reportes',
						short_name: 'Reportes',
						description: 'Ver reportes estratégicos y métricas',
						url: '/reports',
						icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }]
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2,ttf,eot}'],
				// Estrategia de caché para rutas SPA - CacheFirst para mejor performance
				navigateFallback: '/index.html',
				navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/admin/],
				// Fallback offline
				navigateFallbackAllowlist: [/^(?!\/__).*/],
				// Runtime caching strategies
				runtimeCaching: [
					// API de Supabase - NetworkFirst con fallback a caché
					{
						urlPattern: /^https:\/\/azjaehrdzdfgrumbqmuc\.supabase\.co\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-api-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24, // 24 hours
							},
							networkTimeoutSeconds: 10,
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					// Assets estáticos - CacheFirst para máxima velocidad
					{
						urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'static-assets-cache',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					// Imágenes - StaleWhileRevalidate para balance
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					// HTML y rutas - NetworkFirst para siempre tener la última versión
					{
						urlPattern: /\.(?:html)$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'html-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24, // 24 hours
							},
							networkTimeoutSeconds: 5,
						},
					},
					// Rutas de la aplicación - NetworkFirst con fallback offline
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24, // 24 hours
							},
							networkTimeoutSeconds: 5,
						},
					},
				],
				// Limpiar cachés antiguos automáticamente
				cleanupOutdatedCaches: true,
				// Skip waiting para actualizaciones inmediatas
				skipWaiting: true,
				clientsClaim: true,
			},
			devOptions: {
				enabled: false,
				type: 'module',
			},
			// Inyectar el manifest en el HTML
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
			},
		}),
		addTransformIndexHtml
	],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
	},
	optimizeDeps: {
		include: [
			'react',
			'react-dom',
			'react/jsx-runtime',
			'react/jsx-dev-runtime',
			'react-dom/client',
			'react-router-dom',
			'@tanstack/react-query',
			'react-hook-form',
			'react-helmet',
			'react-intersection-observer',
			'framer-motion',
			'lucide-react' // Pre-bundle para mejor performance
		],
		force: false,
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
			treeShaking: true, // Mejor tree-shaking
		},
	},
	resolve: {
		dedupe: ['react', 'react-dom'],
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json', ],
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@/context': path.resolve(__dirname, './src/context'),
			'@/contexts': path.resolve(__dirname, './src/contexts'),
			'react': path.resolve(__dirname, './node_modules/react'),
			'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
		},
	},
	build: {
		target: 'esnext',
		minify: 'esbuild',
		cssMinify: true,
		sourcemap: false,
		reportCompressedSize: false, // Faster builds
		commonjsOptions: {
			transformMixedEsModules: true,
		},
		rollupOptions: {
			external: [
				'@babel/parser',
				'@babel/traverse',
				'@babel/generator',
				'@babel/types'
			],
			output: {
				// Optimized chunking strategy
				manualChunks: (id) => {
					// Separate vendor chunks for better caching
					if (id.includes('node_modules')) {
						// React core in separate chunk
						if (id.includes('react') || id.includes('react-dom')) {
							return 'vendor-react';
						}
						// UI libraries
						if (id.includes('@radix-ui') || id.includes('lucide-react')) {
							return 'vendor-ui';
						}
						// Data libraries
						if (id.includes('@tanstack') || id.includes('@supabase')) {
							return 'vendor-data';
						}
						// Charts
						if (id.includes('chart.js') || id.includes('react-chartjs')) {
							return 'vendor-charts';
						}
						// Everything else
						return 'vendor';
					}
				},
				// Configuración de nombres de archivos
				chunkFileNames: 'assets/[name]-[hash].js',
				entryFileNames: 'assets/[name]-[hash].js',
				assetFileNames: 'assets/[name]-[hash].[ext]',
				chunkSizeWarningLimit: 1000,
				// Prevenir code splitting problemático
				inlineDynamicImports: false,
			}
		},
		chunkSizeWarningLimit: 1000
	}
});
