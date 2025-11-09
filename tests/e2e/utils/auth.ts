import { expect, type Page } from '@playwright/test';

type LoginOptions = {
  email?: string;
  password?: string;
  redirectUrl?: string | RegExp;
};

const DEFAULT_TEST_EMAIL =
  process.env.PLAYWRIGHT_TEST_EMAIL ||
  process.env.CORE_ADMIN_EMAIL ||
  'team@growpals.mx';

const DEFAULT_TEST_PASSWORD =
  process.env.PLAYWRIGHT_TEST_PASSWORD ||
  process.env.E2E_TEST_PASSWORD ||
  process.env.CORE_PASSWORD_GROWPALS;

export async function loginAsAdmin(page: Page, options: LoginOptions = {}) {
  const email = options.email ?? DEFAULT_TEST_EMAIL;
  const password = options.password ?? DEFAULT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Configura PLAYWRIGHT_TEST_EMAIL y PLAYWRIGHT_TEST_PASSWORD (o CORE_PASSWORD_GROWPALS) para ejecutar pruebas autenticadas.'
    );
  }

  // Limpiar estado previo
  await page.context().clearCookies();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Navegar a login y esperar a que cargue completamente
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Esperar a que React renderice completamente
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    },
    { timeout: 30000 }
  );
  
  // Esperar adicional para que los componentes se rendericen
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Esperar a que los inputs estén visibles antes de interactuar
  // Intentar múltiples selectores para mayor robustez
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
  
  // Llenar los campos usando el selector más confiable
  const emailInput = page.locator('#email, input[type="email"], input[name="email"]').first();
  await emailInput.fill(email, { timeout: 10000 });
  
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(password, { timeout: 10000 });
  
  // Esperar y hacer click en el botón de login
  const loginButton = page.getByRole('button', { name: /iniciar sesión/i });
  await loginButton.waitFor({ state: 'visible', timeout: 15000 });
  await loginButton.click({ timeout: 10000 });

  // Esperar redirección
  const expectedUrl = options.redirectUrl ?? /\/dashboard/;
  await page.waitForURL(expectedUrl, { timeout: 25_000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await expect(page).toHaveURL(expectedUrl);
}
