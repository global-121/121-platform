import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import DemoProgramBankTransfer from '@121-service/src/seed-data/program/demo-program-bank-transfer.json';
import DemoProgramExcel from '@121-service/src/seed-data/program/demo-program-excel.json';
import DemoProgramMobileMoney from '@121-service/src/seed-data/program/demo-program-mobile-money.json';
import ProgramNlrcOcw from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.demoPrograms, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

const programsMap: Record<
  string,
  | typeof DemoProgramMobileMoney
  | typeof DemoProgramBankTransfer
  | typeof ProgramNlrcOcw
  | typeof DemoProgramExcel
> = {
  'demo-program-mobile-money.json': DemoProgramMobileMoney,
  'demo-program-bank-transfer.json': DemoProgramBankTransfer,
  'program-nlrc-ocw.json': ProgramNlrcOcw,
  'demo-program-excel.json': DemoProgramExcel,
};

test('Seed Demo Setup', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const table = new TableComponent(page);

  const seedConfigDemo = SEED_CONFIGURATION_SETTINGS.find(
    (config) => config.name === SeedScript.demoPrograms,
  )!;

  for (const program of seedConfigDemo.programs) {
    const programJson = programsMap[program.program];

    await test.step(`Select program ${programJson.titlePortal.en}`, async () => {
      await page.goto('/');
      await registrationsPage.selectProgram(programJson.titlePortal.en!);
    });

    await test.step('Check if program has registrations', async () => {
      // In this reset, we expect 4 registrations for each program because we do not seed all registrations because that takes too long for CI/CD
      // We are not validating the registrations here, just the count
      // Validating imported registrations is covered in other tests
      await table.validateAllRecordsCount(4);
    });
  }
});
