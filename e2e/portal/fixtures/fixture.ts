import { test as base, TestInfo } from '@playwright/test';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
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
import FspSettingsPage from '@121-e2e/portal/pages/FspSettingsPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';
import ProgramMonitoring from '@121-e2e/portal/pages/ProgramMonitoringPage';
import ProgramSettingsPage from '@121-e2e/portal/pages/ProgramSettingsPage';
import ProgramTeamPage from '@121-e2e/portal/pages/ProgramTeamPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationDataPage from '@121-e2e/portal/pages/RegistrationDataPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';
import RegistrationPersonalInformationPage from '@121-e2e/portal/pages/RegistrationPersonalInformationPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';
import UsersPage from '@121-e2e/portal/pages/UsersPage';

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
    includeRegistrationEvents?: boolean;
    approverMode?: ApproverSeedMode;
  }) => Promise<void>;
  login: () => Promise<void>;
  onlyResetAndSeedRegistrations: (params) => Promise<void>;
  accessToken: string;
  exportDataComponent: ExportData;
  tableComponent: TableComponent;
  fspSettingsPage: FspSettingsPage;
  homePage: HomePage;
  loginPage: LoginPage;
  paymentPage: PaymentPage;
  paymentsPage: PaymentsPage;
  programMonitoringPage: ProgramMonitoring;
  programSettingsPage: ProgramSettingsPage;
  programTeamPage: ProgramTeamPage;
  registrationActivityLogPage: RegistrationActivityLogPage;
  registrationDataPage: RegistrationDataPage;
  registrationDebitCardPage: RegistrationDebitCardPage;
  registrationPersonalInformationPage: RegistrationPersonalInformationPage;
  registrationsPage: RegistrationsPage;
  usersPage: UsersPage;
};

/**
 * Resets the database to some known state.
 *
 * Can be used as part of a beforeAll or beforeEach hook.
 * We need this to be a separate function because we want to use it in multiple fixtures.
 */
const resetDatabase = async ({
  seedScript,
  includeRegistrationEvents,
  approverMode,
  nameOfFileContainingTest,
}: {
  seedScript: SeedScript;
  includeRegistrationEvents?: boolean;
  approverMode?: ApproverSeedMode;
  nameOfFileContainingTest: string;
}) => {
  // Logic to reset the database and seed registrations
  await resetDB(
    seedScript,
    nameOfFileContainingTest,
    includeRegistrationEvents ?? false,
    approverMode,
  );
};

/**
 * Seeds the database with registrations.
 *
 * Can be used as part of a beforeAll or beforeEach hook.
 * We need this to be a separate function because we want to use it in multiple fixtures.
 */
const seedRegistrations = async ({
  addPaidRegistrations,
  programId,
  registrations,
  seedWithStatus,
  skipSeedRegistrations,
  transferValue,
}: {
  addPaidRegistrations?: boolean;
  programId?: number;
  registrations?: TestRegistration[];
  seedWithStatus?: RegistrationStatusEnum;
  skipSeedRegistrations?: boolean;
  transferValue?: number;
}) => {
  if (skipSeedRegistrations) {
    return;
  }
  // The access token does not need to be the same as in tests.
  const accessToken = await getAccessToken();

  if (addPaidRegistrations) {
    await seedPaidRegistrations({
      registrations: registrations!,
      programId: programId!,
      transferValue: transferValue ?? 20,
      completeStatuses: [TransactionStatusEnum.success],
    });
  } else if (seedWithStatus) {
    await seedRegistrationsWithStatus(
      registrations ?? [],
      programId ?? 1,
      accessToken,
      seedWithStatus,
    );
  } else {
    await seedIncludedRegistrations(
      registrations ?? [],
      programId ?? 1,
      accessToken,
    );
  }
};

export const customSharedFixture = base.extend<Fixtures>({
  // This fixture function actually does 5 things:
  // 1. Resets the database to a known state.
  // 2. Seeds the database with registrations.
  // 3. Logs in to the portal.
  // 4. Optionally navigates to a specific page after login.
  // 5. Returns the access token.
  resetDBAndSeedRegistrations: async ({ page }, use, testInfo: TestInfo) => {
    const fn = async (params: {
      // For resetting the database.
      approverMode?: ApproverSeedMode;
      includeRegistrationEvents?: boolean;
      seedScript: SeedScript;
      // For seeding registrations.
      programId?: number;
      registrations?: TestRegistration[];
      seedPaidRegistrations?: boolean;
      seedWithStatus?: RegistrationStatusEnum;
      skipSeedRegistrations?: boolean;
      transferValue?: number;
      // For logging and navigation afterwards.
      navigateToPage?: string;
      username?: string;
      password?: string;
    }): Promise<void> => {
      await resetDatabase({
        approverMode: params.approverMode,
        includeRegistrationEvents: params.includeRegistrationEvents,
        seedScript: params.seedScript,
        nameOfFileContainingTest: testInfo.file,
      });
      await seedRegistrations({
        skipSeedRegistrations: params.skipSeedRegistrations,
        registrations: params.registrations,
        programId: params.programId,
        seedWithStatus: params.seedWithStatus,
        addPaidRegistrations: params.seedPaidRegistrations,
        transferValue: params.transferValue,
      });

      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto('/');
      await loginPage.login(params.username, params.password);

      // Optionally navigate to a specific page after login
      if (params.navigateToPage) {
        await loginPage.goto(params.navigateToPage);
      }
    };

    await use(fn);
  },

  login: async ({ page }, use) => {
    const fn = async (): Promise<void> => {
      const loginPage = new LoginPage(page);
      await loginPage.goto('/');
      await loginPage.login();
    };
    await use(fn);
  },

  /**
   * "only" to indicate that it _only_ does those things and not a bunch of
   * other stuff like the resetDBAndSeedRegistrations fixture.
   *
   * Can be used in beforeAll and beforeEach as it does not use page.
   */
  onlyResetAndSeedRegistrations: async ({}, use, testInfo: TestInfo) => {
    const fn = async (params) => {
      await resetDatabase({
        approverMode: params.approverMode,
        includeRegistrationEvents: params.includeRegistrationEvents,
        seedScript: params.seedScript,
        nameOfFileContainingTest: testInfo.file,
      });
      await seedRegistrations({
        skipSeedRegistrations: params.skipSeedRegistrations,
        registrations: params.registrations,
        programId: params.programId,
        seedWithStatus: params.seedWithStatus,
        addPaidRegistrations: params.seedPaidRegistrations,
        transferValue: params.transferValue,
      });
    };
    await use(fn);
  },

  accessToken: async ({}, use) => {
    const accessToken = await getAccessToken();
    await use(accessToken);
  },

  exportDataComponent: async ({ page }, use) => {
    await use(new ExportData(page));
  },

  tableComponent: async ({ page }, use) => {
    await use(new TableComponent(page));
  },

  fspSettingsPage: async ({ page }, use) => {
    await use(new FspSettingsPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },

  paymentsPage: async ({ page }, use) => {
    await use(new PaymentsPage(page));
  },

  programMonitoringPage: async ({ page }, use) => {
    await use(new ProgramMonitoring(page));
  },

  programSettingsPage: async ({ page }, use) => {
    await use(new ProgramSettingsPage(page));
  },

  programTeamPage: async ({ page }, use) => {
    await use(new ProgramTeamPage(page));
  },

  registrationActivityLogPage: async ({ page }, use) => {
    await use(new RegistrationActivityLogPage(page));
  },

  registrationDataPage: async ({ page }, use) => {
    await use(new RegistrationDataPage(page));
  },

  registrationDebitCardPage: async ({ page }, use) => {
    await use(new RegistrationDebitCardPage(page));
  },

  registrationPersonalInformationPage: async ({ page }, use) => {
    await use(new RegistrationPersonalInformationPage(page));
  },

  registrationsPage: async ({ page }, use) => {
    await use(new RegistrationsPage(page));
  },

  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },
});
