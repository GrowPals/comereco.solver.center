import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

/**
 * Tests para validar que las rutas están normalizadas y funcionan correctamente
 */
test.describe('Rutas Normalizadas', () => {
  test('debe redirigir /producto/:id a /products/:id si es UUID válido', async ({ page }) => {
    // Usar un UUID válido para la prueba
    const validUUID = 'a0b8ebe3-0891-43cb-a52f-a7e5a5e3de61';
    
    // Navegar a la ruta antigua con UUID válido
    await page.goto(`/producto/${validUUID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperar a que React renderice
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );
    
    // Esperar a que la redirección ocurra (con timeout más largo)
    await page.waitForURL(new RegExp(`/products/${validUUID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), { timeout: 20000 });
    
    // Verificar que la URL actual no contiene /producto/
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/producto/');
    expect(currentUrl).toContain(`/products/${validUUID}`);
  });

  test('debe redirigir /producto/:id inválido a /catalog', async ({ page }) => {
    // Capturar errores de consola
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('products') || url.includes('requisition_items')) {
          networkErrors.push(`${response.status()}: ${url}`);
        }
      }
    });
    
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
    
    // Esperar a que la redirección ocurra a /catalog
    await page.waitForURL(/\/catalog/, { timeout: 20000 });
    
    // Verificar que la URL actual es /catalog
    const currentUrl = page.url();
    expect(currentUrl).toContain('/catalog');
    expect(currentUrl).not.toContain('/producto/');
    expect(currentUrl).not.toContain('/products/');
    
    // Esperar un poco más para asegurar que no hay queries pendientes
    await page.waitForTimeout(2000);
    
    // Verificar que NO se hicieron queries con el ID inválido
    const invalidUUIDQueries = networkErrors.filter(err => 
      err.includes('test-123') || err.includes('invalid input syntax for type uuid')
    );
    
    // Verificar que NO hay errores de enum business_status con "delivered"
    const deliveredEnumErrors = consoleErrors.filter(err => 
      err.includes('delivered') && err.includes('business_status')
    );
    
    expect(invalidUUIDQueries.length).toBe(0);
    expect(deliveredEnumErrors.length).toBe(0);
  });

  test('debe mantener las rutas protegidas accesibles y normalizadas', async ({ page }) => {
    // Login y esperar a que complete completamente
    await loginAsAdmin(page);
    
    // Esperar a que la página termine de cargar después del login
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000); // Margen extra para renderizado

    await page.goto('/products/test-product-id', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page).toHaveURL(/\/products\//);

    const routes = [
      '/dashboard',
      '/catalog',
      '/requisitions',
      '/templates',
      '/favorites',
      '/settings',
      '/help',
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Verificar que no es página 404
      const is404 = await page.locator('text=404').isVisible().catch(() => false);
      expect(is404).toBe(false);
      
      // Verificar que la URL es correcta
      const url = page.url();
      expect(url).toMatch(new RegExp(route.replace('/', '\\/')));
    }

    await page.goto('/catalog');
    const links = await page.locator('a[href*="/producto/"]').count();
    expect(links).toBe(0);
  });
});
