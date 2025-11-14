import test, { expect } from '@playwright/test';
import { format } from 'date-fns';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramSettingsPage from '@121-e2e/portal/pages/ProgramSettingsPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
  // Navigate to program
  await loginPage.selectProgram('NLRC OCW program');
});

test('Edit Program Information', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const programSettings = new ProgramSettingsPage(page);

  const programInfo = {
    name: 'TUiR Warta',
    description: 'TUiR Warta description',
    dateRange: { start: todaysDate, end: futureDate },
    location: 'Polen',
    targetRegistrations: '200',
  };

  const budgetInfo = {
    fundsAvailable: '200',
    currency: CurrencyCode.CAD,
    paymentFrequency: '2-months',
    defaultTransferValue: '200',
    fixedTransferValue: '100',
  };

  // Act
  await test.step('Navigate to program settings', async () => {
    await registrations.navigateToProgramPage('Settings');
  });

  await test.step('Select: Program Information', async () => {
    await programSettings.navigateToProgramSettingsPage('Program information');
  });

  await test.step('Edit basic information', async () => {
    await programSettings.clickEditProgramInformationSectionByTitle(
      'Basic information',
    );
    await programSettings.editInformationFieldByLabel(
      'Program name',
      programInfo.name,
    );
    await programSettings.editInformationFieldByLabel(
      'Program description',
      programInfo.description,
    );
    await programSettings.selectDateRange(programInfo.dateRange);
    await programSettings.editInformationFieldByLabel(
      'Location',
      programInfo.location,
    );
    await programSettings.editInformationFieldByLabel(
      '*Target registrations',
      programInfo.targetRegistrations,
    );
    await programSettings.saveChanges();
    await programSettings.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await programSettings.basicInformationDataList.getData();
      expect(basicInformationData).toEqual({
        '*Program name': programInfo.name,
        'Program description': programInfo.description,
        'Start date': format(programInfo.dateRange.start, 'd MMMM yyyy'),
        'End date': format(programInfo.dateRange.end, 'd MMMM yyyy'),
        Location: programInfo.location,
        '*Target registrations': programInfo.targetRegistrations,
        'Enable validation': 'No',
        'Enable scope': 'No',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Edit Budget information', async () => {
    await programSettings.clickEditProgramInformationSectionByTitle('Budget');
    await programSettings.editInformationFieldByLabel(
      'Funds available',
      budgetInfo.fundsAvailable,
    );
    await programSettings.selectCurrency(budgetInfo.currency);
    await programSettings.editInformationFieldByLabel(
      'Default transactions per registration',
      budgetInfo.defaultTransferValue,
    );
    await programSettings.editInformationFieldByLabel(
      '*Fixed transfer value',
      budgetInfo.fixedTransferValue,
    );
    await programSettings.saveChanges();
    await programSettings.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const budgetData = await programSettings.budgetDataList.getData();
      expect(budgetData).toEqual({
        'Funds available': budgetInfo.fundsAvailable,
        '*Currency': budgetInfo.currency,
        'Default transactions per registration':
          budgetInfo.defaultTransferValue,
        '*Fixed transfer value': budgetInfo.fixedTransferValue,
      });
    }).toPass({ timeout: 2000 });
  });
});
