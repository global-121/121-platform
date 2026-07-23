import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { createProgramInfo } from '../../CreateProgram/create-program-data';

const programInfo = createProgramInfo({ fsps: [Fsps.excel] });

const excelConfiguration = [
  'Excel Payment Instructions', // Fsp name
  'UI_CPO1', // Brand code
  'RC02', // Cover letter code
  '510121323', // Funding token code
  'true', // Card distribution by mail
  '25000', // Max amount to spend per month in cents
];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.productionInitialState,
    skipSeedRegistrations: true,
  });
});

test('Duplicate and delete Excel FSP', async ({
  homePage,
  page,
  registrationsPage,
  fspSettingsPage,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);

  // Act
  await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
    await homePage.openCreateNewProgram();
    await createProgramDialog.fillInStep1(programInfo);
    await createProgramDialog.fillInStep2(programInfo);
    await createProgramDialog.fillInStep3(programInfo);
    const newProgramId = 1; // Id of newly created program based on SeedScript.productionInitialState
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully created.');
  });

  await test.step('Finish Excel FSP configuration', async () => {
    await registrationsPage.navigateToProgramPage('Settings');
    await fspSettingsPage.clickFspIntegration();
    await fspSettingsPage.validateFspVisibility({
      fspNames: [Fsps.excel],
    });

    await fspSettingsPage.reconfigureFsp(excelConfiguration);
  });
});
