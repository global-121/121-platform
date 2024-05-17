import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../services/.env');
dotenv.config({ path: envPath });

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 1,
  /* Opt out of parallel tests on CI. */
  reporter: [
    ['list'],
    // [
    //   '@alex_neo/playwright-azure-reporter',
    //   {
    //     orgUrl: process.env.AZURE_DEV_URL,
    //     token: process.env.AZURE_DEVOPS_TOKEN,
    //     planId: 27408,
    //     projectName: '121 Platform',
    //     environment: 'AQA',
    //     logging: true,
    //     testRunTitle: 'Playwright Test Suite',
    //     publishTestResultsMode: 'testRun',
    //     uploadAttachments: true,
    //     attachmentsType: ['screenshot', 'video', 'trace'],
    //     testRunConfig: {
    //       owner: {
    //         displayName: 'Krajewski, Piotr',
    //       },
    //       comment: 'Playwright Test Suite',
    //       configurationIds: [],
    //     },
    //   } as AzureReporterOptions,
    // ],
  ],
  /* Shared settings for all the projects below. See https://playwright.devdocs/api/class-testoptions. */
  workers: 1,
  outputDir: './test-results',
  timeout: 20000,
  use: {
    baseURL: process.env.BASE_URL,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    acceptDownloads: true,
    actionTimeout: 20000,
    launchOptions: {
      downloadsPath: 'resources/downloads',
      args: ['--window-size=1920,1024'],
    },
    viewport: null,
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        channel: 'chromium',
      },
    },
    // {
    //   name: 'chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],
});
