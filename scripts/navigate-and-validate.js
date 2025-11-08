#!/usr/bin/env node

/**
 * Script para navegar y validar la aplicación usando Playwright
 * Simula navegación como usuario para verificar que todo funciona
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';

async function navigateAndValidate() {
  console.log('🌐 Iniciando navegación automatizada...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Ver el navegador
    slowMo: 500 // Más lento para ver qué pasa
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Simular dispositivo desktop
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📄 Navegando a la página principal...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    console.log('✅ Screenshot guardado: test-results/homepage.png');
    
    // Verificar título
    const title = await page.title();
    console.log(`📌 Título de la página: ${title}`);
    
    // Verificar que la página carga
    const hasContent = await page.locator('body').count() > 0;
    console.log(`✅ Contenido cargado: ${hasContent}`);
    
    // Buscar elementos clave
    console.log('\n🔍 Buscando elementos clave...');
    
    // Buscar botón de login
    const loginButton = page.getByRole('button', { name: /Iniciar Sesión|Login/i });
    const loginExists = await loginButton.count() > 0;
    console.log(`   Login button: ${loginExists ? '✅ Encontrado' : '❌ No encontrado'}`);
    
    // Verificar rutas en la página
    console.log('\n🛣️  Verificando rutas...');
    const links = await page.locator('a[href]').all();
    const routes = new Set();
    
    for (const link of links.slice(0, 20)) { // Primeros 20 enlaces
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        routes.add(href);
      }
    }
    
    console.log(`   Enlaces encontrados: ${routes.size}`);
    console.log(`   Rutas: ${Array.from(routes).slice(0, 10).join(', ')}`);
    
    // Verificar que no hay rutas no normalizadas
    const hasOldRoutes = Array.from(routes).some(r => r.includes('/producto/'));
    console.log(`   Rutas normalizadas: ${!hasOldRoutes ? '✅' : '❌ Encontradas rutas /producto/'}`);
    
    // Verificar errores de consola
    console.log('\n🚨 Verificando errores...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && 
            !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Esperar un poco para capturar errores
    await page.waitForTimeout(2000);
    
    console.log(`   Errores críticos: ${consoleErrors.length === 0 ? '✅ Ninguno' : `❌ ${consoleErrors.length}`}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 3).forEach(err => console.log(`      - ${err}`));
    }
    
    // Verificar performance
    console.log('\n⚡ Verificando performance...');
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perfData ? perfData.loadEventEnd - perfData.fetchStart : 0,
        domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.fetchStart : 0,
        resources: performance.getEntriesByType('resource').length
      };
    });
    
    console.log(`   Tiempo de carga: ${metrics.loadTime}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   Recursos cargados: ${metrics.resources}`);
    
    // Intentar navegar a diferentes rutas
    console.log('\n🧭 Probando navegación...');
    const testRoutes = ['/catalog', '/dashboard', '/login'];
    
    for (const route of testRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 5000 });
        const currentUrl = page.url();
        const is404 = await page.locator('text=404').count() > 0;
        console.log(`   ${route}: ${is404 ? '❌ 404' : '✅ Carga correcta'} (${currentUrl})`);
      } catch (error) {
        console.log(`   ${route}: ⚠️  ${error.message}`);
      }
    }
    
    console.log('\n✅ Navegación completada');
    console.log('\n📊 Resumen:');
    console.log(`   - Página principal: ✅`);
    console.log(`   - Rutas normalizadas: ${!hasOldRoutes ? '✅' : '❌'}`);
    console.log(`   - Errores críticos: ${consoleErrors.length === 0 ? '✅' : '❌'}`);
    console.log(`   - Performance: ${metrics.loadTime < 3000 ? '✅' : '⚠️'} (${metrics.loadTime}ms)`);
    
  } catch (error) {
    console.error('❌ Error durante la navegación:', error.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    // Mantener el navegador abierto por 3 segundos para ver
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Ejecutar
navigateAndValidate().catch(console.error);

