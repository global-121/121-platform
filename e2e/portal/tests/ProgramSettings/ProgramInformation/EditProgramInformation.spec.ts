import { expect } from '@playwright/test';
import { format } from 'date-fns';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getProgram,
  patchProgram,
} from '@121-service/test/helpers/program.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });

  await patchProgram(
    programIdOCW,
    {
      titlePortal: {
        nl: 'something dutch to check if it does not disappear',
        en: 'NLRC OCW program',
      },
    },
    accessToken,
  );
});

test('Edit Program Information', async ({
  programSettingsPage,
  accessToken,
}) => {
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
    // First navigate to the program's settings that was created during setup
    await programSettingsPage.goto(`/program/${programIdOCW}/settings`);
  });

  await test.step('Select: Program Information', async () => {
    await programSettingsPage.navigateToProgramSettingsPage(
      'Program information',
    );
  });

  await test.step('Edit basic information', async () => {
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Basic information',
    );
    await programSettingsPage.editInformationFieldByLabel(
      'Program name',
      programInfo.name,
    );
    await programSettingsPage.editInformationFieldByLabel(
      'Program description',
      programInfo.description,
    );
    await programSettingsPage.selectDateRange(programInfo.dateRange);
    await programSettingsPage.editInformationFieldByLabel(
      'Location',
      programInfo.location,
    );
    await programSettingsPage.editInformationFieldByLabel(
      '*Target registrations',
      programInfo.targetRegistrations,
    );
    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await programSettingsPage.basicInformationDataList.getData();
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

    // Also validate the API still returns other language translations for a translatable field
    // It is suboptimal to do this check via the API, but this is for covering a bug that occurred before, by using a combination of the UI and API
    const program = await getProgram(programIdOCW, accessToken);
    expect(program.body.titlePortal?.nl).toBeDefined();
  });

  await test.step('Edit Budget information', async () => {
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Budget',
    );
    await programSettingsPage.editInformationFieldByLabel(
      'Funds available',
      budgetInfo.fundsAvailable,
    );
    await programSettingsPage.selectCurrency(budgetInfo.currency);
    await programSettingsPage.editInformationFieldByLabel(
      'Default transactions per registration',
      budgetInfo.defaultTransferValue,
    );
    await programSettingsPage.editInformationFieldByLabel(
      '*Fixed transfer value',
      budgetInfo.fixedTransferValue,
    );
    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const budgetData = await programSettingsPage.budgetDataList.getData();
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
