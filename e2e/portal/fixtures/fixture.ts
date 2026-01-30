import { test as base } from '@playwright/test';

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
    fileName?: string;
    navigateToPage?: string;
  }) => Promise<{ accessToken: string }>;
  paymentSetup: {
    paymentPage: PaymentPage;
    paymentsPage: PaymentsPage;
  };
};

export const test = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
      fileName?: string;
      navigateToPage?: string;
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
      if (params.navigateToPage) {
        await page.goto(params.navigateToPage);
      }

      return { accessToken };
    };

    await use(resetAndSeed);
  },

  paymentSetup: async ({ page }, use) => {
    const paymentPage = new PaymentPage(page);
    const paymentsPage = new PaymentsPage(page);
    await use({ paymentPage, paymentsPage });
  },
});
