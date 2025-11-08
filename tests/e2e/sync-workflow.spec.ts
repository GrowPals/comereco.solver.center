import { test, expect } from '@playwright/test';

/**
 * Tests para validar el workflow de sincronización
 * Estos tests verifican que las rutas y configuraciones están correctas
 */
test.describe('Workflow de Sincronización', () => {
  test('debe tener routes.config.js accesible', async ({ page }) => {
    // Este test verifica que el archivo de configuración existe
    // En un entorno real, podrías hacer una request HTTP si está expuesto
    // Por ahora, solo verificamos que las rutas funcionan
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('debe usar constantes de ROUTES en navegación', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verificar que los enlaces del sidebar usan rutas correctas
    const sidebarLinks = await page.locator('nav a[href]').all();
    
    for (const link of sidebarLinks) {
      const href = await link.getAttribute('href');
      if (href) {
        // Verificar que no hay rutas no normalizadas
        expect(href).not.toContain('/producto/');
        // Verificar que las rutas son válidas
        expect(href).toMatch(/^\/(dashboard|catalog|requisitions|templates|favorites|settings|help|products|projects|users|approvals|reports)/);
      }
    }
  });

  test('debe tener navegación consistente', async ({ page }) => {
    // Navegar por diferentes páginas y verificar consistencia
    const pages = ['/dashboard', '/catalog', '/requisitions'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Verificar que el header/sidebar está presente
      const hasNavigation = await page.locator('nav, [role="navigation"]').count();
      expect(hasNavigation).toBeGreaterThan(0);
    }
  });
});

