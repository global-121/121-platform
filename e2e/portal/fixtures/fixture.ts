import { test as base } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '../pages/LoginPage';
import PaymentsPage from '../pages/PaymentsPage';

// Define a proper type for registration data
type TestRegistration = {
  fullName?: string;
  paymentAmountMultiplier?: number;
  [key: string]: unknown; // Allow additional properties
};

type TestProgram = {
  titlePortal: { en: string };
  fixedTransferValue: number;
  currency: string;
  currencySymbol?: string;
  [key: string]: unknown;
};

type PaymentScenario = 'successful' | 'failed';

type Fixtures = {
  resetDBAndSeedRegistrations: (params: {
    seedScript: SeedScript;
    registrations: TestRegistration[];
    programId: number;
  }) => Promise<{ accessToken: string }>;
  validatePaymentCard: (params: {
    program: TestProgram;
    registrations: TestRegistration[];
    programId: number;
    scenario: PaymentScenario;
  }) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  resetDBAndSeedRegistrations: async ({ page }, use) => {
    const resetAndSeed = async (params: {
      seedScript: SeedScript;
      registrations: TestRegistration[];
      programId: number;
    }): Promise<{ accessToken: string }> => {
      // Logic to reset the database and seed registrations
      await resetDB(params.seedScript, __filename);
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

      return { accessToken };
    };

    await use(resetAndSeed);
  },

  validatePaymentCard: async ({ page }, use) => {
    const validate = async (params: {
      program: TestProgram;
      registrations: TestRegistration[];
      programId: number;
      scenario: PaymentScenario;
    }) => {
      const { program, registrations, programId, scenario } = params;
      const paymentsPage = new PaymentsPage(page);

      // Calculate common values
      const numberOfPas = registrations.length;
      const defaultTransferValue = program.fixedTransferValue;
      const defaultMaxTransferValue = registrations.reduce((output, pa) => {
        return (
          output + (pa.paymentAmountMultiplier ?? 1) * defaultTransferValue
        );
      }, 0);
      const lastPaymentDate = format(new Date(), 'dd/MM/yyyy');

      // Set success/failure values based on scenario
      const successfulTransactions =
        scenario === 'successful' ? defaultMaxTransferValue : 0;
      const failedTransactions = scenario === 'failed' ? numberOfPas : 0;

      // Map common currency codes to symbols if currencySymbol is not provided
      const getCurrencySymbol = (program: TestProgram): string => {
        if (program.currencySymbol) {
          return program.currencySymbol;
        }

        // Common currency code to symbol mappings
        const currencySymbols: Record<string, string> = {
          EUR: '€',
        };

        return currencySymbols[program.currency] || program.currency;
      };

      await paymentsPage.validatePaymentCard({
        date: lastPaymentDate,
        paymentAmount: defaultMaxTransferValue,
        registrationsNumber: numberOfPas,
        successfulTransactions,
        failedTransactions,
        currency: getCurrencySymbol(program),
        programId,
      });
    };

    await use(validate);
  },
});
