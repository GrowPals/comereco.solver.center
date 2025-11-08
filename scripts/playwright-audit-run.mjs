import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const EMAIL = process.env.AUDIT_EMAIL || 'team@growpals.mx';
const PASSWORD = process.env.AUDIT_PASSWORD || 'growpals#2025!';
const OUTPUT_DIR = process.env.AUDIT_OUTPUT_DIR || '.playwright-mcp/audit-v3';

const routes = [
  { slug: 'dashboard', path: '/dashboard' },
  { slug: 'requisitions', path: '/requisitions' },
  { slug: 'approvals', path: '/approvals' },
  { slug: 'templates', path: '/templates' },
  { slug: 'reports', path: '/reports' },
  { slug: 'help', path: '/help' },
];

const viewports = [
  {
    name: 'desktop-light',
    options: { viewport: { width: 1400, height: 900 } },
    theme: 'light'
  },
  {
    name: 'desktop-dark',
    options: { viewport: { width: 1400, height: 900 } },
    theme: 'dark'
  },
  {
    name: 'mobile-light',
    options: { ...devices['iPhone 14 Pro'] },
    theme: 'light'
  },
  {
    name: 'mobile-dark',
    options: { ...devices['iPhone 14 Pro'] },
    theme: 'dark'
  }
];

const onlyViewport = process.env.AUDIT_VIEWPORT;
const onlyRoute = process.env.AUDIT_ROUTE;

const selectedViewports = onlyViewport
  ? viewports.filter((viewport) => viewport.name === onlyViewport)
  : viewports;

const selectedRoutes = onlyRoute
  ? routes.filter((route) => route.slug === onlyRoute)
  : routes;

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button:has-text("Iniciar Sesión")');
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 60000 }),
    page.waitForSelector('.app-main-shell', { timeout: 60000 })
  ]).catch(() => {});
}

async function capture() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const viewport of selectedViewports) {
    const context = await browser.newContext({ ...viewport.options });
    await context.addInitScript((theme) => {
      try {
        window.localStorage.setItem('theme', theme);
      } catch (_) {}
    }, viewport.theme);

    const page = await context.newPage();
    await login(page);
    await page.evaluate((theme) => {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    }, viewport.theme);

    for (const route of selectedRoutes) {
      try {
        await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 45000 });
        if (route.afterNavigate) {
          try {
            await route.afterNavigate(page);
          } catch (error) {
            console.warn(`afterNavigate failed for ${route.slug}:`, error);
          }
        }
        await page.waitForTimeout(1000);
        const filePath = join(OUTPUT_DIR, `${viewport.name}__${route.slug}.png`);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log('Saved', filePath);
      } catch (error) {
        console.error(`Failed capturing ${route.slug} on ${viewport.name}:`, error.message);
      }
    }

    await context.close();
  }

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
