import { test as base } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '../pages/LoginPage';

// Define a proper type for registration data
type TestRegistration = {
  fullName?: string;
  paymentAmountMultiplier?: number;
  [key: string]: unknown; // Allow additional properties
};

type Fixtures = {
  resetDBAndSeedRegistrations: (params: {
    seedScript: SeedScript;
    registrations: TestRegistration[];
    programId: number;
  }) => Promise<void>;
  accessToken: string;
};

export const test = base.extend<Fixtures>({
  accessToken: async ({}, use) => {
    const token = await getAccessToken();
    await use(token);
  },

  resetDBAndSeedRegistrations: async ({ page, accessToken }, use) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
    }) => {
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, __filename);
      await seedIncludedRegistrations(
        params.registrations,
        params.programId,
        accessToken,
      );

      // Login
      const loginPage = new LoginPage(page);
      await page.goto('/');
      await loginPage.login();
    };

    await use(resetAndSeed);
  },
});
