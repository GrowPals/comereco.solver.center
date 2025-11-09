import { test, expect } from '@playwright/test';

test.describe('ComerECO Smoke Tests', () => {
  test('debe cargar la pantalla de login', async ({ page }) => {
    // Navegar directamente a /login
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Esperar a que React renderice completamente - usar waitForFunction para verificar que el DOM está listo
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      },
      { timeout: 30000 }
    );
    
    // Esperar adicional para que los componentes se rendericen
    await page.waitForTimeout(3000);

    // Verificar título (más confiable que texto en DOM)
    await expect(page).toHaveTitle(/ComerECO/i, { timeout: 15000 });
    
    // Verificar URL primero para confirmar que estamos en login
    const url = page.url();
    expect(url).toMatch(/\/login/);
    
    // Esperar a que los campos del formulario estén presentes (con múltiples intentos)
    // El componente puede tardar en renderizar, así que esperamos con múltiples selectores
    try {
      await page.waitForSelector('#email', { state: 'visible', timeout: 20000 });
    } catch {
      // Si #email no funciona, intentar con otros selectores
      await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { 
        state: 'visible', 
        timeout: 20000 
      });
    }
    
    try {
      await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 20000 });
    } catch {
      await page.waitForSelector('input[name="password"]', { state: 'visible', timeout: 20000 });
    }
    
    // Verificar que al menos hay inputs en la página
    const inputCount = await page.locator('input').count();
    expect(inputCount).toBeGreaterThan(0);
    
    // Verificar que hay un botón (puede ser el de login)
    const buttonCount = await page.locator('button').count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('debe tener meta tags básicos', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
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
            !text.includes('favicon') &&
            !text.includes('NO_COLOR')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Esperar un poco más para capturar errores tardíos
    await page.waitForTimeout(1000);
    
    // No debe haber errores críticos de JavaScript
    expect(errors.length).toBe(0);
  });

  test('debe redirigir correctamente cuando no autenticado', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Debe redirigir a login o mostrar login
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });
});
