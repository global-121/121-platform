import { test as base, TestInfo } from '@playwright/test';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';

// Define a comprehensive type for test registration data
// Based on RegistrationEntity with commonly used test-specific properties
type TestRegistration = Partial<RegistrationEntity> & {
  // Test-specific properties not in the entity
  programFspConfigurationName?: string;
  // Additional test-specific properties with constrained types
  testProperties?: Record<string, string | number | boolean>;
};

type Fixtures = {
  resetDBAndSeedRegistrations: (params: {
    seedScript: SeedScript;
    registrations: TestRegistration[];
    programId: number;
    navigateToPage?: string;
  }) => Promise<{ accessToken: string }>;
  paymentPage: PaymentPage;
  paymentsPage: PaymentsPage;
  registrationDataPage: RegistrationDataPage;
};

export const customSharedFixture = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use, testInfo: TestInfo) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
      navigateToPage?: string;
    }): Promise<{ accessToken: string }> => {
      const nameOfFileContainingTest = testInfo.file;
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, nameOfFileContainingTest);
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
      if (params.navigateToPage) {
        await page.goto(params.navigateToPage);
      }

      return { accessToken };
    };

    await use(resetAndSeed);
  },

  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },

  paymentsPage: async ({ page }, use) => {
    await use(new PaymentsPage(page));
  },

  registrationDataPage: async ({ page }, use) => {
    await use(new RegistrationDataPage(page));
  },
});
