import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { SEED_CONFIGURATION_SETTINGS } from '@121-service/src/scripts/seed-configuration.const';
import DemoProjectBankTransfer from '@121-service/src/seed-data/project/demo-project-bank-transfer.json';
import DemoProjectExcel from '@121-service/src/seed-data/project/demo-project-excel.json';
import DemoProjectMobileMoney from '@121-service/src/seed-data/project/demo-project-mobile-money.json';
import ProjectNlrcOcw from '@121-service/src/seed-data/project/project-nlrc-ocw.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.demoProjects, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

const projectsMap: Record<
  string,
  | typeof DemoProjectMobileMoney
  | typeof DemoProjectBankTransfer
  | typeof ProjectNlrcOcw
  | typeof DemoProjectExcel
> = {
  'demo-project-mobile-money.json': DemoProjectMobileMoney,
  'demo-project-bank-transfer.json': DemoProjectBankTransfer,
  'project-nlrc-ocw.json': ProjectNlrcOcw,
  'demo-project-excel.json': DemoProjectExcel,
};

test('Seed Demo Setup', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const table = new TableComponent(page);

  const seedConfigDemo = SEED_CONFIGURATION_SETTINGS.find(
    (config) => config.name === SeedScript.demoProjects,
  )!;

  for (const project of seedConfigDemo.projects) {
    const projectJson = projectsMap[project.project];

    await test.step(`Select project ${projectJson.titlePortal.en}`, async () => {
      await page.goto('/');
      await registrationsPage.selectProject(projectJson.titlePortal.en!);
    });

    await test.step('Check if project has registrations', async () => {
      // In this reset, we expect 4 registrations for each project because we do not seed all registrations because that takes too long for CI/CD
      // We are not validating the registrations here, just the count
      // Validating imported registrations is covered in other tests
      await table.validateAllRecordsCount(4);
    });
  }
});
