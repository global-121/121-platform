import { test as base } from '@playwright/test';
import { startEnvironment, stopEnvironment } from './testContainer_compose';

const test = base.extend<{ baseURL: string }>({
  // Define the modifier function
  baseURL: async ({}, use: (url: string) => Promise<void>) => {
    const port = await startEnvironment();
    const dynamicURL = `http://localhost:${port}`;
    await use(dynamicURL);
  },
});

test.afterAll(async () => {
  await stopEnvironment();
});

export { test };
