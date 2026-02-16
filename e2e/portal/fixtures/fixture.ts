import { test as base, TestInfo } from '@playwright/test';

import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  seedIncludedRegistrations,
  seedRegistrationsWithStatus,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

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
    seedWithStatus?: RegistrationStatusEnum;
  }) => Promise<{ accessToken: string }>;
  paymentPage: PaymentPage;
  paymentsPage: PaymentsPage;
  registrationDataPage: RegistrationDataPage;
  registrationsPage: RegistrationsPage;
  tableComponent: TableComponent;
};

export const customSharedFixture = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use, testInfo: TestInfo) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
      navigateToPage?: string;
      seedWithStatus?: RegistrationStatusEnum;
    }): Promise<{ accessToken: string }> => {
      const nameOfFileContainingTest = testInfo.file;
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, nameOfFileContainingTest);
      const accessToken = await getAccessToken();
      if (params.seedWithStatus) {
        await seedRegistrationsWithStatus(
          params.registrations,
          params.programId,
          accessToken,
          params.seedWithStatus,
        );
      } else {
        await seedIncludedRegistrations(
          params.registrations,
          params.programId,
          accessToken,
        );
      }
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

  registrationsPage: async ({ page }, use) => {
    await use(new RegistrationsPage(page));
  },

  tableComponent: async ({ page }, use) => {
    await use(new TableComponent(page));
  },
});
