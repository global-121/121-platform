import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: './portalicious/tests',
  use: {
    ...baseConfig.use,
    baseURL: process.env.BASE_URL_PORTALICIOUS,
  },
});
