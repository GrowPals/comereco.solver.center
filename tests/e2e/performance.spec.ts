import { test, expect } from '@playwright/test';

/**
 * Tests de performance y optimizaciones
 */
test.describe('Performance y Optimizaciones', () => {
  test('debe cargar la página principal rápidamente', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });

  test('debe tener chunks optimizados', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Obtener recursos cargados
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('.js'))
        .map((entry: any) => ({
          name: entry.name,
          size: entry.transferSize,
          duration: entry.duration
        }));
    });

    // Verificar que hay chunks separados (vendor-react, vendor-ui, etc.)
    const chunkNames = resources.map((r: any) => r.name);
    const hasVendorChunks = chunkNames.some((name: string) => 
      name.includes('vendor') || name.includes('chunk')
    );
    
    expect(hasVendorChunks).toBeTruthy();
  });

  test('debe tener lazy loading funcionando', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar que no todos los chunks se cargan inmediatamente
    const initialResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('.js'))
        .length;
    });

    // Navegar a otra página
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');
    
    const afterNavigationResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('.js'))
        .length;
    });

    // Debe haber cargado recursos adicionales (lazy loading)
    expect(afterNavigationResources).toBeGreaterThan(initialResources);
  });

  test('debe tener imágenes con lazy loading', async ({ page }) => {
    await page.goto('/catalog');
    
    // Buscar imágenes con atributo loading="lazy"
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    
    // Debe haber al menos algunas imágenes con lazy loading
    expect(lazyImages).toBeGreaterThan(0);
  });
});

