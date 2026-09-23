import { defineConfig } from '@playwright/test';
import path from 'node:path';
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- The specific Node.js version in use supports this already.
import { loadEnvFile } from 'node:process';

loadEnvFile(path.resolve(__dirname, '../services/.env'));

export default defineConfig({
  tsconfig: './tsconfig.json',
  testDir: './portal/tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: false,
  // eslint-disable-next-line n/no-process-env -- This environment variable `CI` is NOT used in the 121-service, thus not managed via the env.ts file.
  forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test.only in the source code.
  retries: 1,
  reporter: [['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  workers: 1,
  outputDir: './test-results',
  timeout: 60_000,
  use: {
    // eslint-disable-next-line n/no-process-env -- This environment variable `BASE_URL` is NOT used in the 121-service, thus not managed via the env.ts file.
    baseURL: process.env.BASE_URL ?? 'http://localhost:8088',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    acceptDownloads: true,
    actionTimeout: 20_000,
    launchOptions: {
      downloadsPath: 'resources/downloads',
      args: [
        // '--window-workspace=1', // Specify on which monitor the browser will appear (0=primary monitor, 1=extra monitor)
        // '--window-position=0,0', // Specify/force the position of the browser window (x,y) in pixels from top-left
        '--window-size=1920,1024', // Specify/force the size of the browser window (width,height) in pixels
        // '--start-maximized', // Alternative to window-size
      ],
    },
    contextOptions: {
      // reducedMotion: 'reduce', // Uncomment to disable animations/transitions (to find out if those are the cause of flakiness.) ONLY USE FOR DEBUGGING, DO NOT COMMIT THIS CHANGE!
    },
    viewport: null,
    ignoreHTTPSErrors: true,
    bypassCSP: false,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { channel: 'chromium' },
    },
  ],
});
