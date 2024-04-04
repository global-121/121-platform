import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.devdocs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  /* Reporter to use. See https://playwright.devdocs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.devdocs/api/class-testoptions. */
  workers: process.env.CI ? 1 : undefined,
  outputDir: './test-results',
  timeout: 20000,
  use: {
    baseURL: 'https://playwright.dev',
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
    /*Igonore insecure connections */
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    /* Collect trace when retrying the failed test. See https://playwright.devdocs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://playwright.dev'
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'https://playwright.dev'
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        baseURL: 'https://playwright.dev'
      },
    },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
