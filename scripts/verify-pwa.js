#!/usr/bin/env node

/**
 * Script de verificación PWA
 * Verifica que todos los archivos y configuraciones PWA estén correctos
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const checks = {
	manifest: {
		file: join(rootDir, 'public', 'manifest.webmanifest'),
		required: ['name', 'short_name', 'icons', 'start_url', 'display'],
	},
	offline: {
		file: join(rootDir, 'public', 'offline.html'),
		required: ['<!DOCTYPE html>', 'Sin Conexión'],
	},
	robots: {
		file: join(rootDir, 'public', 'robots.txt'),
		required: ['User-agent', 'Sitemap'],
	},
	sitemap: {
		file: join(rootDir, 'public', 'sitemap.xml'),
		required: ['<?xml', '<urlset', '<url>'],
	},
	browserconfig: {
		file: join(rootDir, 'public', 'browserconfig.xml'),
		required: ['<?xml', '<browserconfig>', '<msapplication>'],
	},
	index: {
		file: join(rootDir, 'index.html'),
		required: ['manifest.webmanifest', 'theme-color', 'og:title', 'schema.org'],
	},
	viteConfig: {
		file: join(rootDir, 'vite.config.js'),
		required: ['VitePWA', 'workbox', 'runtimeCaching'],
	},
	pwaComponent: {
		file: join(rootDir, 'src', 'components', 'PWAUpdatePrompt.jsx'),
		required: ['PWAUpdatePrompt', 'updateAvailable', 'isOffline'],
	},
};

let passed = 0;
let failed = 0;
const errors = [];

console.log('🔍 Verificando configuración PWA...\n');

for (const [name, check] of Object.entries(checks)) {
	const exists = existsSync(check.file);
	
	if (!exists) {
		failed++;
		errors.push(`❌ ${name}: Archivo no encontrado - ${check.file}`);
		continue;
	}
	
	const content = readFileSync(check.file, 'utf-8');
	const missing = check.required.filter(req => !content.includes(req));
	
	if (missing.length > 0) {
		failed++;
		errors.push(`❌ ${name}: Faltan elementos requeridos - ${missing.join(', ')}`);
	} else {
		passed++;
		console.log(`✅ ${name}: OK`);
	}
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Resultados: ${passed} pasados, ${failed} fallidos`);

if (errors.length > 0) {
	console.log('\n❌ Errores encontrados:');
	errors.forEach(err => console.log(`   ${err}`));
	process.exit(1);
} else {
	console.log('\n✅ Todas las verificaciones pasaron correctamente!');
	console.log('\n📱 La aplicación está lista para ser instalada como PWA.');
	process.exit(0);
}

