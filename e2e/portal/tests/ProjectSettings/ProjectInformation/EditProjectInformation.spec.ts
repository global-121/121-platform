import test, { expect } from '@playwright/test';
import { format } from 'date-fns';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettingsPage from '@121-e2e/portal/pages/ProjectSettingsPage';
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

test('[38155] Edit Project Information', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const projectSettings = new ProjectSettingsPage(page);

  const projectInfo = {
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
    defaultTransferAmount: '200',
    fixedTransferValue: '100',
  };

  // Act
  await test.step('Navigate to project settings', async () => {
    await registrations.navigateToProgramPage('Settings');
  });

  await test.step('Select: Project Information', async () => {
    await projectSettings.navigateToProgramSettingsPage('Project information');
  });

  await test.step('Edit basic information', async () => {
    await projectSettings.clickEditSectionByTitle('Basic information');
    await projectSettings.editInformationFieldByLabel(
      'Project name',
      projectInfo.name,
    );
    await projectSettings.editInformationFieldByLabel(
      'Project description',
      projectInfo.description,
    );
    await projectSettings.selectDateRange(projectInfo.dateRange);
    await projectSettings.editInformationFieldByLabel(
      'Location',
      projectInfo.location,
    );
    await projectSettings.editInformationFieldByLabel(
      '*Target registrations',
      projectInfo.targetRegistrations,
    );
    await projectSettings.saveChanges();
    await projectSettings.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await projectSettings.basicInformationDataList.getData();
      expect(basicInformationData).toEqual({
        '*Project name': projectInfo.name,
        'Project description': projectInfo.description,
        'Start date': format(projectInfo.dateRange.start, 'd MMMM yyyy'),
        'End date': format(projectInfo.dateRange.end, 'd MMMM yyyy'),
        Location: projectInfo.location,
        '*Target registrations': projectInfo.targetRegistrations,
        'Enable validation': 'No',
        'Enable scope': 'No',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Edit Budget information', async () => {
    await projectSettings.clickEditSectionByTitle('Budget');
    await projectSettings.editInformationFieldByLabel(
      'Funds available',
      budgetInfo.fundsAvailable,
    );
    await projectSettings.selectCurrency(budgetInfo.currency);
    await projectSettings.editInformationFieldByLabel(
      'Default transfers per registration',
      budgetInfo.defaultTransferAmount,
    );
    await projectSettings.editInformationFieldByLabel(
      '*Fixed transfer value',
      budgetInfo.fixedTransferValue,
    );
    await projectSettings.saveChanges();
    await projectSettings.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const budgetData = await projectSettings.budgetDataList.getData();
      expect(budgetData).toEqual({
        'Funds available': budgetInfo.fundsAvailable,
        '*Currency': budgetInfo.currency,
        'Default transfers per registration': budgetInfo.defaultTransferAmount,
        '*Fixed transfer value': budgetInfo.fixedTransferValue,
      });
    }).toPass({ timeout: 2000 });
  });
});
