import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../services/.env');
dotenv.config({ path: envPath });

export default defineConfig({
  testDir: './portal/tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  forbidOnly:
    // eslint-disable-next-line n/no-process-env -- This environment variable `CI` is NOT used in the 121-service, thus not managed via the env.ts file.
    !!process.env.CI, // Fail the build on CI if you accidentally left test.only in the source code.
  retries: 1,
  reporter: [['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  workers: 1,
  outputDir: './test-results',
  timeout: 60_000,
  use: {
    // eslint-disable-next-line n/no-process-env -- This environment variable `BASE_URL` is NOT used in the 121-service, thus not managed via the env.ts file.
    baseURL: process.env.BASE_URL,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    acceptDownloads: true,
    actionTimeout: 20_000,
    launchOptions: {
      downloadsPath: 'resources/downloads',
      args: ['--window-size=1920,1024'],
    },
    viewport: null,
    ignoreHTTPSErrors: true,
    bypassCSP: false,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chromium',
      },
    },
  ],
});
