import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [resolve(__dirname, 'setup.ts')],
    testTimeout: 30000,
  },
});
