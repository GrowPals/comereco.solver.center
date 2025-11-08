import { test, expect } from '@playwright/test';

test.describe('ComerECO smoke tests', () => {
  test('login screen renders', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle(/ComerECO/i);
    await expect(page.getByRole('heading', { name: /ComerECO/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i })).toBeVisible();
  });
});
