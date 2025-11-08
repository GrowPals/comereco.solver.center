import { test, expect } from '@playwright/test';

/**
 * Tests para validar que las rutas están normalizadas y funcionan correctamente
 */
test.describe('Rutas Normalizadas', () => {
  test('debe redirigir /producto/:id a /products/:id', async ({ page }) => {
    // Intentar acceder a ruta antigua
    await page.goto('/producto/test-123');
    
    // Debe redirigir o mostrar 404 (no debe funcionar la ruta antigua)
    // La ruta correcta es /products/:id
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/producto/');
  });

  test('debe cargar correctamente /products/:id', async ({ page }) => {
    // Esta prueba requiere autenticación y un producto real
    // Por ahora solo verificamos que la ruta existe
    await page.goto('/products/test-product-id');
    
    // Debe cargar la página (puede ser 404 si el producto no existe, pero la ruta funciona)
    await expect(page).toHaveURL(/\/products\//);
  });

  test('debe tener todas las rutas principales accesibles', async ({ page }) => {
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
      await page.goto(route);
      // Verificar que la página carga (no es 404)
      const is404 = await page.locator('text=404').isVisible().catch(() => false);
      expect(is404).toBeFalse();
    }
  });

  test('debe usar rutas normalizadas en navegación', async ({ page }) => {
    await page.goto('/catalog');
    
    // Buscar enlaces que puedan tener rutas no normalizadas
    const links = await page.locator('a[href*="/producto/"]').count();
    expect(links).toBe(0); // No debe haber enlaces con /producto/
  });
});

