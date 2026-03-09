import { playwright } from '@vitest/browser-playwright';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '',
  test: {
    browser: {
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      reportsDirectory: path.join(__dirname, './coverage'),
      reporter: [['lcov'], ['text-summary']],
    },
  },
});
