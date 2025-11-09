import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils/auth';

/**
 * Tests para validar el workflow de sincronización
 * Estos tests verifican que las rutas y configuraciones están correctas
 */
test.describe('Workflow de Sincronización', () => {
  test('debe exponer navegación consistente para rutas críticas', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    const sidebarLinks = await page.locator('nav a[href]').all();
    for (const link of sidebarLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      expect(href).not.toContain('/producto/');
      expect(href).toMatch(/^\/(dashboard|catalog|requisitions|templates|favorites|settings|help|products|projects|users|approvals|reports)/);
    }

    const pagesToCheck = ['/dashboard', '/catalog', '/requisitions'];
    for (const pagePath of pagesToCheck) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const hasNavigation = await page.locator('nav, [role="navigation"]').count();
      expect(hasNavigation).toBeGreaterThan(0);
    }
  });
});
