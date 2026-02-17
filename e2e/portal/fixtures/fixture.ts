import { test as base, TestInfo } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  seedIncludedRegistrations,
  seedPaidRegistrations,
  seedRegistrationsWithStatus,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import ExportData from '@121-e2e/portal/components/ExportData';
import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import ProgramMonitoring from '@121-e2e/portal/pages/ProgramMonitoringPage';
import ProgramTeamPage from '@121-e2e/portal/pages/ProgramTeamPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';
import RegistrationPersonalInformationPage from '@121-e2e/portal/pages/RegistrationPersonalInformationPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

import HomePage from '../pages/HomePage';

// Re-export expect for convenience
export { expect } from '@playwright/test';

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
    skipSeedRegistrations?: boolean;
    registrations?: TestRegistration[];
    programId?: number;
    navigateToPage?: string;
    seedWithStatus?: RegistrationStatusEnum;
    seedPaidRegistrations?: boolean;
    transferValue?: number;
    username?: string;
    password?: string;
  }) => Promise<{ accessToken: string }>;
  paymentPage: PaymentPage;
  paymentsPage: PaymentsPage;
  registrationDataPage: RegistrationDataPage;
  registrationsPage: RegistrationsPage;
  registrationDebitCardPage: RegistrationDebitCardPage;
  registrationPersonalInformationPage: RegistrationPersonalInformationPage;
  registrationActivityLogPage: RegistrationActivityLogPage;
  tableComponent: TableComponent;
  exportDataComponent: ExportData;
  homePage: HomePage;
  loginPage: LoginPage;
  programTeamPage: ProgramTeamPage;
  programMonitoringPage: ProgramMonitoring;
};

export const customSharedFixture = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use, testInfo: TestInfo) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      skipSeedRegistrations?: boolean;
      registrations?: TestRegistration[];
      programId?: number;
      navigateToPage?: string;
      seedWithStatus?: RegistrationStatusEnum;
      seedPaidRegistrations?: boolean;
      transferValue?: number;
      username?: string;
      password?: string;
    }): Promise<{ accessToken: string }> => {
      const nameOfFileContainingTest = testInfo.file;
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, nameOfFileContainingTest);
      const accessToken = await getAccessToken();

      if (!params.skipSeedRegistrations) {
        if (params.seedPaidRegistrations) {
          await seedPaidRegistrations({
            registrations: params.registrations!,
            programId: params.programId!,
            transferValue: params.transferValue ?? 20,
            completeStatuses: [TransactionStatusEnum.success],
          });
        } else if (params.seedWithStatus) {
          await seedRegistrationsWithStatus(
            params.registrations ?? [],
            params.programId ?? 1,
            accessToken,
            params.seedWithStatus,
          );
        } else {
          await seedIncludedRegistrations(
            params.registrations ?? [],
            params.programId ?? 1,
            accessToken,
          );
        }
      }
      // Login
      const loginPage = new LoginPage(page);
      await page.goto('/');
      await loginPage.login(params.username, params.password);
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

  registrationDebitCardPage: async ({ page }, use) => {
    await use(new RegistrationDebitCardPage(page));
  },

  registrationPersonalInformationPage: async ({ page }, use) => {
    await use(new RegistrationPersonalInformationPage(page));
  },

  registrationActivityLogPage: async ({ page }, use) => {
    await use(new RegistrationActivityLogPage(page));
  },

  exportDataComponent: async ({ page }, use) => {
    await use(new ExportData(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  programTeamPage: async ({ page }, use) => {
    await use(new ProgramTeamPage(page));
  },

  programMonitoringPage: async ({ page }, use) => {
    await use(new ProgramMonitoring(page));
  },
});
