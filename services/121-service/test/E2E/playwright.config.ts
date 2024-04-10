import { defineConfig, devices } from '@playwright/test';
import { AzureReporterOptions } from '@alex_neo/playwright-azure-reporter/dist/playwright-azure-reporter';
import path from 'path';
const envPath = path.resolve(__dirname, '../../../.env');
import dotenv from 'dotenv';
dotenv.config({ path: envPath });

export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  /* Opt out of parallel tests on CI. */
  /* Reporter to use. See https://playwright.devdocs/test-reporters */
  reporter: [
    ['list'],
    [
      '@alex_neo/playwright-azure-reporter',
      {
        orgUrl: 'https://dev.azure.com/redcrossnl',
        token: process.env.AZURE_DEVOPS_TOKEN,
        planId: 27408,
        projectName: '121 Platform',
        environment: 'AQA',
        logging: true,
        testRunTitle: 'Playwright Test Run',
        publishTestResultsMode: 'testRun',
        uploadAttachments: true,
        attachmentsType: ['screenshot', 'video', 'trace'],
        testRunConfig: {
          owner: {
            displayName: 'Krajewski, Piotr',
          },
          comment: 'Playwright Test Run',
          configurationIds: [],
        },
      } as AzureReporterOptions,
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.devdocs/api/class-testoptions. */
  workers: process.env.CI ? 1 : undefined,
  outputDir: './test-results',
  timeout: 10000,
  use: {
    baseURL: process.env.BASE_URL,
    video:'on-first-retry',
    screenshot: 'only-on-failure',
    headless: false,
    acceptDownloads: true,
    actionTimeout: 20000,
    launchOptions: {
        downloadsPath: 'resources/downloads',
        args: ['--start-maximized']
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
