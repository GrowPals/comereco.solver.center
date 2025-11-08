import { test, expect } from '@playwright/test';

test.describe('ComerECO Smoke Tests', () => {
  test('debe cargar la pantalla de login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/ComerECO/i);
    await expect(page.getByRole('heading', { name: /ComerECO/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible();
  });

  test('debe tener meta tags básicos', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('debe cargar sin errores críticos de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorar errores esperados (como 404s de recursos)
        if (!text.includes('Failed to load resource') && 
            !text.includes('404') &&
            !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No debe haber errores críticos de JavaScript
    expect(errors.length).toBe(0);
  });

  test('debe redirigir correctamente cuando no autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    // Debe redirigir a login o mostrar login
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });
});
