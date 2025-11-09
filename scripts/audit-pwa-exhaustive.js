#!/usr/bin/env node

/**
 * Auditoría exhaustiva PWA usando Playwright
 * Verifica todos los aspectos de PWA, SEO, performance y funcionalidad
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const results = {
  passed: [],
  failed: [],
  warnings: [],
  metrics: {}
};

console.log('🔍 Iniciando auditoría exhaustiva PWA...\n');
console.log(`📍 URL base: ${BASE_URL}\n`);

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
});

const page = await context.newPage();

// Función helper para checks
function check(name, condition, message) {
  if (condition) {
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } else {
    results.failed.push({ name, message });
    console.log(`❌ ${name}: ${message}`);
  }
}

function warn(name, message) {
  results.warnings.push({ name, message });
  console.log(`⚠️  ${name}: ${message}`);
}

try {
  console.log('📄 1. Verificando página principal...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  
  // Verificar título
  const title = await page.title();
  check('Título de página', title.includes('ComerECO'), `Título: ${title}`);
  
  // Verificar meta description
  const description = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
  check('Meta description', !!description && description.length > 50, `Descripción: ${description?.substring(0, 50)}...`);
  
  // Verificar manifest link
  const manifestLink = await page.$eval('link[rel="manifest"]', el => el.href).catch(() => null);
  check('Manifest link', !!manifestLink, `Manifest: ${manifestLink}`);
  
  // Verificar theme-color
  const themeColor = await page.$eval('meta[name="theme-color"]', el => el.content).catch(() => null);
  check('Theme color', !!themeColor, `Theme color: ${themeColor}`);
  
  // Verificar Open Graph tags
  const ogTitle = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null);
  check('Open Graph title', !!ogTitle, `OG Title: ${ogTitle}`);
  
  const ogImage = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null);
  check('Open Graph image', !!ogImage, `OG Image: ${ogImage}`);
  
  // Verificar Schema.org
  const schemaScripts = await page.$$eval('script[type="application/ld+json"]', scripts => 
    scripts.map(s => {
      try {
        return JSON.parse(s.textContent);
      } catch {
        return null;
      }
    }).filter(Boolean)
  );
  check('Schema.org scripts', schemaScripts.length >= 2, `Encontrados ${schemaScripts.length} schemas`);
  
  if (schemaScripts.length > 0) {
    const hasWebApp = schemaScripts.some(s => s['@type'] === 'WebApplication');
    check('Schema WebApplication', hasWebApp, 'WebApplication schema presente');
    
    const hasOrg = schemaScripts.some(s => s['@type'] === 'Organization');
    check('Schema Organization', hasOrg, 'Organization schema presente');
  }
  
  // Verificar canonical
  const canonical = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => null);
  check('Canonical URL', !!canonical, `Canonical: ${canonical}`);
  
  // Verificar robots meta
  const robots = await page.$eval('meta[name="robots"]', el => el.content).catch(() => null);
  check('Robots meta tag', !!robots && robots.includes('index'), `Robots: ${robots}`);
  
  console.log('\n📱 2. Verificando manifest.json...');
  
  if (manifestLink) {
    const manifestResponse = await page.goto(manifestLink);
    if (manifestResponse.ok()) {
      const manifest = await manifestResponse.json();
      
      check('Manifest name', !!manifest.name, `Name: ${manifest.name}`);
      check('Manifest short_name', !!manifest.short_name, `Short name: ${manifest.short_name}`);
      check('Manifest icons', manifest.icons?.length >= 2, `Iconos: ${manifest.icons?.length}`);
      check('Manifest display', manifest.display === 'standalone', `Display: ${manifest.display}`);
      check('Manifest start_url', manifest.start_url === '/', `Start URL: ${manifest.start_url}`);
      check('Manifest shortcuts', manifest.shortcuts?.length >= 3, `Shortcuts: ${manifest.shortcuts?.length}`);
      
      // Verificar que los iconos existan
      if (manifest.icons) {
        for (const icon of manifest.icons) {
          const iconUrl = new URL(icon.src, BASE_URL).href;
          const iconResponse = await page.goto(iconUrl, { waitUntil: 'networkidle' }).catch(() => null);
          check(`Icono ${icon.sizes}`, iconResponse?.ok() || iconResponse?.status() === 200, `Icono: ${icon.src}`);
        }
      }
    }
  }
  
  console.log('\n🔧 3. Verificando Service Worker...');
  
  const swRegistered = await page.evaluate(async () => {
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
  
  if (swRegistered.supported === false) {
    warn('Service Worker', 'Navegador no soporta Service Workers');
  } else if (swRegistered.error) {
    warn('Service Worker', `Error: ${swRegistered.error}`);
  } else {
    // En desarrollo, el SW puede no estar registrado
    if (swRegistered.registered) {
      check('Service Worker registrado', true, `Scope: ${swRegistered.scope}`);
      check('Service Worker activo', swRegistered.active, `State: ${swRegistered.state}`);
    } else {
      warn('Service Worker', 'No registrado (normal en desarrollo, verificar en producción)');
    }
  }
  
  console.log('\n🌐 4. Verificando recursos públicos...');
  
  const publicFiles = [
    '/robots.txt',
    '/sitemap.xml',
    '/browserconfig.xml',
    '/offline.html',
    '/manifest.webmanifest'
  ];
  
  for (const file of publicFiles) {
    const response = await page.goto(`${BASE_URL}${file}`, { waitUntil: 'networkidle' }).catch(() => null);
    check(`Archivo ${file}`, response?.ok() || response?.status() === 200, `Status: ${response?.status()}`);
  }
  
  console.log('\n📊 5. Verificando performance...');
  
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
      resources: performance.getEntriesByType('resource').length
    };
  });
  
  results.metrics.performance = performanceMetrics;
  check('DOM Content Loaded', performanceMetrics.domContentLoaded < 3000, `${performanceMetrics.domContentLoaded}ms`);
  check('Load Complete', performanceMetrics.loadComplete < 5000, `${performanceMetrics.loadComplete}ms`);
  check('Total Load Time', performanceMetrics.totalTime < 10000, `${performanceMetrics.totalTime}ms`);
  
  console.log('\n🔗 6. Verificando enlaces y recursos...');
  
  // Verificar que los recursos críticos carguen
  const criticalResources = [
    '/logo.png',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png'
  ];
  
  for (const resource of criticalResources) {
    const response = await page.goto(`${BASE_URL}${resource}`, { waitUntil: 'networkidle' }).catch(() => null);
    check(`Recurso ${resource}`, response?.ok() || response?.status() === 200, `Status: ${response?.status()}`);
  }
  
  console.log('\n📱 7. Verificando responsive design...');
  
  // Probar diferentes viewports
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(500);
    
    const viewportCheck = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return !!meta && meta.content.includes('width=device-width');
    });
    
    check(`Viewport ${viewport.name}`, viewportCheck, `${viewport.width}x${viewport.height}`);
  }
  
  console.log('\n🔒 8. Verificando seguridad...');
  
  // Verificar headers de seguridad (si están disponibles)
  const securityHeaders = await page.evaluate(() => {
    const meta = {
      xContentTypeOptions: document.querySelector('meta[http-equiv="X-Content-Type-Options"]'),
      xXSSProtection: document.querySelector('meta[http-equiv="X-XSS-Protection"]'),
      referrerPolicy: document.querySelector('meta[http-equiv="Referrer-Policy"]'),
      permissionsPolicy: document.querySelector('meta[http-equiv="Permissions-Policy"]')
    };
    return {
      xContentTypeOptions: !!meta.xContentTypeOptions,
      xXSSProtection: !!meta.xXSSProtection,
      referrerPolicy: !!meta.referrerPolicy,
      permissionsPolicy: !!meta.permissionsPolicy
    };
  });
  
  if (securityHeaders.xContentTypeOptions) {
    check('X-Content-Type-Options', true, 'Meta tag presente');
  } else {
    check('X-Content-Type-Options', false, 'Meta tag faltante');
  }
  
  if (securityHeaders.xXSSProtection) {
    check('X-XSS-Protection', true, 'Meta tag presente');
  } else {
    check('X-XSS-Protection', false, 'Meta tag faltante');
  }
  
  if (securityHeaders.referrerPolicy) {
    check('Referrer-Policy', true, 'Meta tag presente');
  } else {
    check('Referrer-Policy', false, 'Meta tag faltante');
  }
  
  if (securityHeaders.permissionsPolicy) {
    check('Permissions-Policy', true, 'Meta tag presente');
  } else {
    check('Permissions-Policy', false, 'Meta tag faltante');
  }
  
  // Verificar que NO haya X-Frame-Options en meta (debe estar solo en headers HTTP)
  const hasXFrameInMeta = await page.$eval('meta[http-equiv="X-Frame-Options"]', () => true).catch(() => false);
  check('X-Frame-Options NO en meta', !hasXFrameInMeta, 'Correcto: solo en headers HTTP');
  
} catch (error) {
  console.error('❌ Error durante auditoría:', error.message);
  results.failed.push({ name: 'Auditoría general', message: error.message });
} finally {
  await browser.close();
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE AUDITORÍA');
console.log('='.repeat(60));
console.log(`✅ Pasados: ${results.passed.length}`);
console.log(`❌ Fallidos: ${results.failed.length}`);
console.log(`⚠️  Advertencias: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Errores encontrados:');
  results.failed.forEach(f => console.log(`   - ${f.name}: ${f.message}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  Advertencias:');
  results.warnings.forEach(w => console.log(`   - ${w.name}: ${w.message}`));
}

if (results.metrics.performance) {
  console.log('\n📊 Métricas de Performance:');
  console.log(`   - DOM Content Loaded: ${results.metrics.performance.domContentLoaded}ms`);
  console.log(`   - Load Complete: ${results.metrics.performance.loadComplete}ms`);
  console.log(`   - Total Time: ${results.metrics.performance.totalTime}ms`);
  console.log(`   - Recursos cargados: ${results.metrics.performance.resources}`);
}

console.log('\n' + '='.repeat(60));

if (results.failed.length === 0) {
  console.log('✅ ¡Todas las verificaciones críticas pasaron!');
  process.exit(0);
} else {
  console.log('❌ Se encontraron errores que requieren atención.');
  process.exit(1);
}

