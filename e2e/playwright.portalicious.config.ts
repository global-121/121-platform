import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: process.env.BASE_URL ?? 'http://localhost:8088',
  },
  testDir: './portalicious/tests',
});
