#!/usr/bin/env node
/**
 * Post-Build Script: Fix React Loading Order
 *
 * PROBLEMA: Vite genera el HTML con scripts en orden incorrecto, causando
 * "Cannot read properties of undefined (reading 'createContext')"
 *
 * SOLUCIÓN: Reordenar scripts para que React cargue PRIMERO
 *
 * Orden correcto:
 * 1. react-vendor.js (contiene React + React-DOM + dependencias)
 * 2. vendor.js (otras librerías)
 * 3. index.js (código de la app)
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'dist', 'index.html');

console.log('🔧 Post-Build: Skipping manual script reordering (handled by Vite)...');

try {
    if (!fs.existsSync(htmlPath)) {
        console.error('❌ Error: dist/index.html not found');
        console.error('   Run "npm run build" first');
        process.exit(1);
    }

    // Vite ya genera el orden correcto, no hacemos cambios manuales
    process.exit(0);

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Extraer TODOS los scripts module (tanto inline como preload)
    const scriptMatches = [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)];
    const preloadMatches = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)">/g)];

    if (scriptMatches.length === 0 && preloadMatches.length === 0) {
        console.log('⚠️  No scripts found, skipping...');
        process.exit(0);
    }

    // Combinar todos los scripts encontrados
    const allScripts = [
        ...scriptMatches.map(m => m[1]),
        ...preloadMatches.map(m => m[1])
    ];

    // Remover duplicados
    const uniqueScripts = [...new Set(allScripts)];

    // Clasificar scripts - Ahora solo hay vendor y index
    const vendorScript = uniqueScripts.find(s =>
        s.includes('vendor') ||
        s.match(/vendor-[a-f0-9]+\.js/)
    );

    const mainScript = uniqueScripts.find(s =>
        s.includes('/index-') ||
        s.match(/index-[a-f0-9]+\.js/)
    );

    if (!vendorScript) {
        console.log('⚠️  Vendor chunk not found');
        console.log('   Scripts found:', uniqueScripts);
        console.log('   Continuing without reordering...');
        process.exit(0);
    }

    if (!mainScript) {
        console.log('⚠️  Main script not found');
        console.log('   Scripts found:', uniqueScripts);
        console.log('   Continuing without reordering...');
        process.exit(0);
    }

    // Eliminar todos los scripts y preloads existentes
    html = html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>(\n)?/g, '');
    html = html.replace(/<link rel="modulepreload" crossorigin href="[^"]+">(\n)?/g, '');

    // Construir el nuevo orden de scripts
    // CRÍTICO: Vendor necesita modulepreload para cargarse ANTES que index
    // Vendor contiene React y todas las dependencias, debe estar completamente cargado antes
    const orderedScripts = [
        vendorScript,  // 1. Vendor (incluye React + todas las librerías)
        mainScript     // 2. App principal ÚLTIMO
    ];

    // Vendor DEBE tener modulepreload para que se cargue y ejecute ANTES que index
    const vendorPreload = `  <link rel="modulepreload" crossorigin href="${vendorScript}">`;
    const scriptsTags = orderedScripts
        .map(script => `  <script type="module" crossorigin src="${script}"></script>`)
        .join('\n');
    
    const newScripts = vendorPreload + '\n' + scriptsTags;

    // Insertar los nuevos scripts después del <title>
    const titleMatch = html.match(/<title>.*?<\/title>/);
    if (titleMatch) {
        html = html.replace(titleMatch[0], titleMatch[0] + '\n' + newScripts);
    } else {
        // Fallback: insertar antes de </head>
        html = html.replace('</head>', newScripts + '\n</head>');
    }

    // Guardar HTML corregido
    fs.writeFileSync(htmlPath, html, 'utf8');

    // Reporte de éxito
    console.log('✅ Script loading order fixed successfully!\n');
    console.log('📋 Load order:');
    orderedScripts.forEach((script, i) => {
        const label = i === 0 ? 'Vendor (FIRST - contains React)' :
                     i === orderedScripts.length - 1 ? 'Main app (LAST)' :
                     'Other';
        console.log(`   ${i + 1}. ${script} - ${label}`);
    });
    console.log('\n✨ Build completed successfully!\n');

} catch (error) {
    console.error('❌ Error fixing HTML:', error.message);
    console.error(error.stack);
    process.exit(1);
}
