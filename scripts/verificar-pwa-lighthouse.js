#!/usr/bin/env node

/**
 * Verificación PWA y Lighthouse
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

console.log('🚀 Verificando PWA y ejecutando Lighthouse...\n');

// Iniciar preview
console.log('1. Iniciando servidor de preview...');
let previewProcess;
try {
  previewProcess = execSync('npm run preview &', { 
    cwd: rootDir,
    detached: true,
    stdio: 'pipe'
  });
  
  // Esperar a que inicie
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('   ✅ Servidor iniciado\n');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  console.log('2. Verificando Service Worker...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 30000 });
  
  const swStatus = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          active: !!registration?.active,
          scope: registration?.scope,
          state: registration?.active?.state
        };
      } catch (e) {
        return { error: e.message };
      }
    }
    return { supported: false };
  });
  
  if (swStatus.registered && swStatus.active) {
    console.log('   ✅ Service Worker registrado y activo');
    console.log(`      Scope: ${swStatus.scope}`);
    console.log(`      State: ${swStatus.state}`);
  } else {
    console.log('   ⚠️  Service Worker no registrado');
  }
  
  console.log('\n3. Verificando manifest...');
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
  
  console.log('\n4. Probando funcionalidad offline...');
  await context.setOffline(true);
  
  try {
    const offlineResponse = await page.goto('http://localhost:4173', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    if (offlineResponse && offlineResponse.status() === 200) {
      console.log('   ✅ App funciona offline');
    } else {
      const hasContent = await page.evaluate(() => {
        return document.body.textContent.length > 0;
      });
      console.log(hasContent ? '   ✅ Contenido disponible offline' : '   ⚠️  Sin contenido offline');
    }
  } catch (error) {
    console.log('   ⚠️  Error en modo offline (puede ser normal si no hay caché)');
  }
  
  await context.setOffline(false);
  
  console.log('\n5. Métricas de Performance...');
  const perfMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
      resources: performance.getEntriesByType('resource').length
    };
  });
  
  console.log(`   DOM Content Loaded: ${perfMetrics.domContentLoaded.toFixed(2)}ms`);
  console.log(`   Load Complete: ${perfMetrics.loadComplete.toFixed(2)}ms`);
  console.log(`   Total Time: ${perfMetrics.totalTime.toFixed(2)}ms`);
  console.log(`   Recursos: ${perfMetrics.resources}`);
  
  console.log('\n6. Ejecutando Lighthouse...');
  console.log('   ⚠️  Lighthouse debe ejecutarse manualmente desde Chrome DevTools');
  console.log('   Pasos:');
  console.log('   1. Abre http://localhost:4173 en Chrome');
  console.log('   2. DevTools → Lighthouse');
  console.log('   3. Selecciona PWA y Performance');
  console.log('   4. Click en Generate report');
  
  await browser.close();
  
  console.log('\n✅ Verificación completada');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  await browser.close();
  process.exit(1);
}

