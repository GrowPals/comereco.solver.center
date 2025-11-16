#!/usr/bin/env node

/**
 * Script para probar funcionalidad offline de la PWA
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

console.log('📴 Probando funcionalidad offline...\n');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  // 1. Cargar la página normalmente
  console.log('1. Cargando página en modo online...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // 2. Verificar que los recursos se hayan cargado
  const resourcesLoaded = await page.evaluate(() => {
    return performance.getEntriesByType('resource').length;
  });
  console.log(`   ✅ ${resourcesLoaded} recursos cargados`);
  
  // 3. Activar modo offline
  console.log('\n2. Activando modo offline...');
  await context.setOffline(true);
  console.log('   ✅ Modo offline activado');
  
  // 4. Intentar navegar (debe usar caché o mostrar offline.html)
  console.log('\n3. Intentando navegar en modo offline...');
  const offlineResponse = await page.goto(BASE_URL, { 
    waitUntil: 'domcontentloaded',
    timeout: 5000 
  }).catch(() => null);
  
  if (offlineResponse) {
    console.log(`   ✅ Página cargada desde caché (Status: ${offlineResponse.status()})`);
  } else {
    // Verificar si hay contenido offline
    const hasOfflineContent = await page.evaluate(() => {
      return document.body.textContent.includes('Sin Conexión') || 
             document.body.textContent.includes('offline') ||
             document.getElementById('root') !== null;
    });
    
    if (hasOfflineContent) {
      console.log('   ✅ Contenido offline disponible');
    } else {
      console.log('   ⚠️  No se detectó contenido offline específico');
    }
  }
  
  // 5. Verificar Service Worker en modo offline
  console.log('\n4. Verificando Service Worker en modo offline...');
  const swStatus = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          registered: !!registration,
          active: !!registration?.active,
          state: registration?.active?.state
        };
      } catch (e) {
        return { error: e.message };
      }
    }
    return { supported: false };
  });
  
  if (swStatus.registered) {
    console.log(`   ✅ Service Worker registrado (State: ${swStatus.state})`);
  } else {
    console.log('   ⚠️  Service Worker no registrado (normal en desarrollo)');
  }
  
  // 6. Verificar caché disponible
  console.log('\n5. Verificando caché disponible...');
  const cacheInfo = await page.evaluate(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        return {
          available: true,
          cacheCount: cacheNames.length,
          cacheNames: cacheNames
        };
      } catch (e) {
        return { error: e.message };
      }
    }
    return { available: false };
  });
  
  if (cacheInfo.available) {
    console.log(`   ✅ Caché disponible (${cacheInfo.cacheCount} cachés)`);
    if (cacheInfo.cacheNames) {
      cacheInfo.cacheNames.forEach(name => {
        console.log(`      - ${name}`);
      });
    }
  } else {
    console.log('   ⚠️  Caché API no disponible o no hay cachés');
  }
  
  // 7. Restaurar conexión
  console.log('\n6. Restaurando conexión...');
  await context.setOffline(false);
  console.log('   ✅ Modo online restaurado');
  
  console.log('\n✅ Prueba de funcionalidad offline completada');
  
} catch (error) {
  console.error('❌ Error durante prueba offline:', error.message);
} finally {
  await browser.close();
}

