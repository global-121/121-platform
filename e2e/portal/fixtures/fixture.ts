import { test as base } from '@playwright/test';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '../pages/LoginPage';

// Define a comprehensive type for test registration data
// Based on RegistrationEntity with commonly used test-specific properties
type TestRegistration = Partial<RegistrationEntity> & {
  // Test-specific properties not in the entity
  programFspConfigurationName?: string;
  // Additional properties that might be added in tests
  [key: string]: unknown;
};

type Fixtures = {
  resetDBAndSeedRegistrations: (params: {
    seedScript: SeedScript;
    registrations: TestRegistration[];
    programId: number;
    fileName: string;
    navigateToProgramPage?: string;
  }) => Promise<{ accessToken: string }>;
};

export const test = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
      fileName: string;
      navigateToProgramPage?: string;
    }): Promise<{ accessToken: string }> => {
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, params.fileName);
      const accessToken = await getAccessToken();
      await seedIncludedRegistrations(
        params.registrations,
        params.programId,
        accessToken,
      );

      // Login
      const loginPage = new LoginPage(page);
      await page.goto('/');
      await loginPage.login();

      // Optionally navigate to a specific page after login
      if (params.navigateToProgramPage) {
        await page.goto(params.navigateToProgramPage);
      }

      return { accessToken };
    };

    await use(resetAndSeed);
  },
});
