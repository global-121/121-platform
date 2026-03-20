import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '',
  test: {
    browser: {
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      reporter: ['lcov', 'text-summary'],
    },
    sequence: {
      shuffle: true,
    },
  },
});
