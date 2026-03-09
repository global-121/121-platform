import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '',
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
    // coverage: {
    //   reportsDirectory: path.join(__dirname, './coverage'),
    //   reporter: [['lcov'], ['text-summary']],
    // },
    // TODO: setting coverage to false fixes knip. keep like this or solve in another way?
    coverage: {
      enabled: false,
    },
  },
});
