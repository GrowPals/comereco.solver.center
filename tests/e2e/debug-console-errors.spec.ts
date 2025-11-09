import { test, expect } from '@playwright/test';

/**
 * Test interactivo para verificar errores de consola
 * Ejecutar con: npx playwright test tests/e2e/debug-console-errors.spec.ts --headed
 */
test.describe('Debug: Errores de Consola', () => {
  test('verificar errores UUID y enum en /producto/test-123', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: { url: string; status: number; body?: string }[] = [];
    
    // Capturar errores de consola
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log(`[CONSOLE ERROR] ${text}`);
      }
    });
    
    // Capturar errores de red
    page.on('response', async (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('products') || url.includes('requisition_items')) {
          let body = '';
          try {
            body = await response.text();
          } catch (e) {
            // Ignorar errores al leer el body
          }
          
          networkErrors.push({
            url,
            status: response.status(),
            body
          });
          
          console.log(`[NETWORK ERROR] ${response.status()} ${url}`);
          if (body) {
            console.log(`[BODY] ${body.substring(0, 200)}`);
          }
        }
      }
    });
    
    // Navegar a la ruta problemática
    console.log('Navegando a /producto/test-123...');
    await page.goto('/producto/test-123', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperar a que React renderice
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );
    
    // Esperar un poco más para capturar todos los errores
    await page.waitForTimeout(3000);
    
    // Verificar la URL final
    const currentUrl = page.url();
    console.log(`URL final: ${currentUrl}`);
    
    // Verificar errores específicos
    const uuidErrors = consoleErrors.filter(err => 
      err.includes('invalid input syntax for type uuid') || 
      err.includes('test-123')
    );
    
    const enumErrors = consoleErrors.filter(err => 
      err.includes('delivered') && err.includes('business_status')
    );
    
    const networkUUIDErrors = networkErrors.filter(err => 
      err.body?.includes('invalid input syntax for type uuid') ||
      err.url.includes('test-123')
    );
    
    const networkEnumErrors = networkErrors.filter(err => 
      err.body?.includes('delivered') && err.body?.includes('business_status')
    );
    
    // Mostrar resumen
    console.log('\n=== RESUMEN DE ERRORES ===');
    console.log(`Errores de consola totales: ${consoleErrors.length}`);
    console.log(`Errores de red totales: ${networkErrors.length}`);
    console.log(`Errores UUID en consola: ${uuidErrors.length}`);
    console.log(`Errores enum en consola: ${enumErrors.length}`);
    console.log(`Errores UUID en red: ${networkUUIDErrors.length}`);
    console.log(`Errores enum en red: ${networkEnumErrors.length}`);
    
    if (uuidErrors.length > 0) {
      console.log('\n=== ERRORES UUID ===');
      uuidErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }
    
    if (enumErrors.length > 0) {
      console.log('\n=== ERRORES ENUM ===');
      enumErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }
    
    if (networkUUIDErrors.length > 0) {
      console.log('\n=== ERRORES UUID EN RED ===');
      networkUUIDErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.status} ${err.url}`);
        if (err.body) console.log(`   Body: ${err.body.substring(0, 300)}`);
      });
    }
    
    if (networkEnumErrors.length > 0) {
      console.log('\n=== ERRORES ENUM EN RED ===');
      networkEnumErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.status} ${err.url}`);
        if (err.body) console.log(`   Body: ${err.body.substring(0, 300)}`);
      });
    }
    
    // Tomar screenshot
    await page.screenshot({ path: 'test-results/debug-console-errors.png', fullPage: true });
    
    // Verificar que NO hay errores (esto fallará si hay errores, mostrando el resumen)
    expect(uuidErrors.length).toBe(0);
    expect(enumErrors.length).toBe(0);
    expect(networkUUIDErrors.length).toBe(0);
    expect(networkEnumErrors.length).toBe(0);
  });
  
  test('verificar redirección funciona correctamente', async ({ page }) => {
    // Navegar a la ruta antigua con ID inválido
    await page.goto('/producto/test-123', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperar a que React renderice
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );
    
    // Esperar a que la redirección ocurra
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`URL después de redirección: ${currentUrl}`);
    
    // Verificar que redirigió a /catalog (ya que test-123 no es UUID válido)
    expect(currentUrl).toContain('/catalog');
  });
});

