import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

// Arrange
test.beforeAll(async () => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await importRegistrations(programIdPV, registrationsPV, accessToken);
});

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('Registration table should clear row selections when filter criteria change', async ({
  page,
}) => {
  const tableComponent = new TableComponent(page);

  await test.step('should clear single row selection when applying a filter', async () => {
    await tableComponent.selectRowByName('Jan Janssen');
    expect(await tableComponent.getSelectedRowsCount()).toBe(1);
    await tableComponent.filterColumnByText('Name', 'Jan');
    expect(await tableComponent.getSelectedRowsCount()).toBe(0);
  });

  await test.step('should clear single row selection when removing a column filter', async () => {
    await tableComponent.selectRowByName('Jan Janssen');
    expect(await tableComponent.getSelectedRowsCount()).toBe(1);
    await tableComponent.clearColumnFilter('Name');
    expect(await tableComponent.getSelectedRowsCount()).toBe(0);
  });

  await test.step('should clear single row selection when clearing all filters', async () => {
    await tableComponent.filterColumnByText('Name', 'Jan');
    await tableComponent.selectRowByName('Jan Janssen');
    expect(await tableComponent.getSelectedRowsCount()).toBe(1);
    await tableComponent.clearAllFilters();
    expect(await tableComponent.getSelectedRowsCount()).toBe(0);
  });

  await test.step('should clear all rows selection when applying a filter', async () => {
    await tableComponent.selectAllCheckbox();
    expect(await tableComponent.getSelectedRowsCount()).toBe(4);
    await tableComponent.filterColumnByText('Name', 'Jan');
    expect(await tableComponent.getSelectedRowsCount()).toBe(0);
  });
});
