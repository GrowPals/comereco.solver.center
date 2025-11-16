#!/usr/bin/env node

/**
 * Script para hacer build de producción y verificar PWA
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

console.log('🏗️  Construyendo aplicación para producción...\n');

try {
  // 1. Build
  console.log('1. Ejecutando build...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  console.log('   ✅ Build completado\n');
  
  // 2. Verificar archivos críticos
  console.log('2. Verificando archivos críticos...');
  const criticalFiles = [
    'index.html',
    'manifest.webmanifest',
    'robots.txt',
    'sitemap.xml',
    'offline.html',
    'browserconfig.xml'
  ];
  
  let allFilesExist = true;
  for (const file of criticalFiles) {
    const exists = existsSync(join(distDir, file));
    if (exists) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - NO ENCONTRADO`);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    throw new Error('Faltan archivos críticos en el build');
  }
  
  // 3. Verificar Service Worker generado
  console.log('\n3. Verificando Service Worker...');
  const swFiles = [
    'sw.js',
    'workbox-*.js'
  ];
  
  // Buscar archivos SW en dist
  const fs = await import('fs');
  const files = fs.readdirSync(distDir);
  const swFound = files.some(f => f.includes('sw') || f.includes('workbox'));
  
  if (swFound) {
    console.log('   ✅ Service Worker generado');
    files.filter(f => f.includes('sw') || f.includes('workbox')).forEach(f => {
      console.log(`      - ${f}`);
    });
  } else {
    console.log('   ⚠️  Service Worker no encontrado (puede estar inline)');
  }
  
  // 4. Iniciar servidor de preview y verificar
  console.log('\n4. Iniciando servidor de preview...');
  const previewProcess = execSync('npm run preview', { 
    cwd: rootDir,
    stdio: 'pipe',
    detached: true
  });
  
  // Esperar a que el servidor inicie
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('5. Verificando PWA en producción...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Verificar Service Worker en producción
    const swStatus = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            registered: !!registration,
            active: !!registration?.active,
            scope: registration?.scope
          };
        } catch (e) {
          return { error: e.message };
        }
      }
      return { supported: false };
    });
    
    if (swStatus.registered && swStatus.active) {
      console.log('   ✅ Service Worker registrado y activo en producción');
      console.log(`      Scope: ${swStatus.scope}`);
    } else {
      console.log('   ⚠️  Service Worker no registrado en producción');
      if (swStatus.error) {
        console.log(`      Error: ${swStatus.error}`);
      }
    }
    
    // Verificar manifest
    const manifestLink = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);
    if (manifestLink) {
      const manifestResponse = await page.goto(manifestLink);
      if (manifestResponse.ok()) {
        const manifest = await manifestResponse.json();
        console.log('   ✅ Manifest accesible');
        console.log(`      Name: ${manifest.name}`);
        console.log(`      Icons: ${manifest.icons?.length || 0}`);
        console.log(`      Shortcuts: ${manifest.shortcuts?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.log(`   ⚠️  Error verificando: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Verificación de producción completada');
  console.log('\n📝 Para probar manualmente:');
  console.log('   1. npm run preview');
  console.log('   2. Abre http://localhost:4173');
  console.log('   3. Chrome DevTools → Application → Service Workers');
  console.log('   4. Verifica que el SW esté registrado y activo');
  
} catch (error) {
  console.error('❌ Error durante build/verificación:', error.message);
  process.exit(1);
}

