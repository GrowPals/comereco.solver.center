import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envFiles = new Set<string>([
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
]);

if (process.env.PLAYWRIGHT_ENV_FILE) {
  envFiles.add(path.resolve(process.cwd(), process.env.PLAYWRIGHT_ENV_FILE));
}

for (const filePath of envFiles) {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

const PORT = process.env.VITE_PORT ?? '5174';
const HOST = process.env.VITE_HOST ?? '127.0.0.1';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 30 * 1000, // 30 segundos por test
  reporter: process.env.CI 
    ? [['html', { open: 'never' }], ['list'], ['json', { outputFile: 'test-results/results.json' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    // Timeouts optimizados
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },
  webServer: {
    command: `npm run dev -- --host ${HOST} --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 2 * 60 * 1000,
    // Esperar a que el servidor esté listo
    waitTimeout: 60 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimizaciones de performance
        viewport: { width: 1280, height: 720 },
      }
    },
    // Agregar más navegadores en CI
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] }
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] }
      }
    ] : [])
  ],
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
});
