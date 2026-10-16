import { expect } from '@playwright/test';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import { searchRegistrationByReferenceId } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 1;

const registrationOnafriq = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFspConfigurationName: Fsps.onafriq,
  phoneNumber: '24311111111',
  phoneNumberPayment: '24322222222',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  firstName: 'Barbara',
  lastName: 'Floyd',
};

const setUpNeededText = 'Set up needed';
const setUpNeededTooltipText = 'an admin must set up the full name';

test('Registrations show "Set up needed" until the full name is set up', async ({
  page,
  registrationActivityLogPage,
  registrationsPage,
  resetDBAndSeedRegistrations,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.onafriqProgram,
    registrations: [registrationOnafriq],
    programId,
  });
  const accessToken = await getAccessToken();
  await patchProgram(programId, { fullnameNamingConvention: [] }, accessToken);

  const searchRegistrationResponse = await searchRegistrationByReferenceId(
    registrationOnafriq.referenceId,
    programId,
    accessToken,
  );
  const { id: registrationId, registrationProgramId } =
    searchRegistrationResponse.body.data[0];
  const registrationsPageUrl = `/program/${programId}/registrations`;
  const registrationPageUrl = `${registrationsPageUrl}/${registrationId}`;

  const getNameCellInTable = async () => {
    await registrationsPage.goto(registrationsPageUrl);
    await registrationsPage.waitForLoaded(1);
    const nameColumnIndex =
      await registrationsPage.table.getColumnIndexByHeaderText('Name');
    return await registrationsPage.table.getCell(0, nameColumnIndex);
  };

  await test.step('Table shows "Set up needed" with an explanation', async () => {
    const nameCell = await getNameCellInTable();

    await expect(nameCell).toContainText(setUpNeededText);
    await nameCell.locator('.pi-info-circle').hover();
    await expect(page.getByRole('tooltip')).toContainText(
      setUpNeededTooltipText,
    );
  });

  await test.step('Registration page shows "Set up needed" with an explanation', async () => {
    await registrationActivityLogPage.goto(registrationPageUrl);

    const title = registrationActivityLogPage.registrationTitle;
    await expect(title).toContainText(`Reg. #${registrationProgramId}`);
    await expect(title).toContainText(setUpNeededText);
    await title.locator('.pi-info-circle').hover();
    await expect(page.getByRole('tooltip')).toContainText(
      setUpNeededTooltipText,
    );
  });

  await test.step('Table and registration page show the name in the order of the full name set up', async () => {
    // Deliberately not in the order of the attributes (First Name, Last Name)
    await patchProgram(
      programId,
      { fullnameNamingConvention: ['lastName', 'firstName'] },
      accessToken,
    );
    const expectedName = `${registrationOnafriq.lastName} ${registrationOnafriq.firstName}`;

    const nameCell = await getNameCellInTable();
    await expect(nameCell).toHaveText(expectedName);

    await registrationActivityLogPage.goto(registrationPageUrl);
    await expect(registrationActivityLogPage.registrationTitle).toHaveText(
      `Reg. #${registrationProgramId} - ${expectedName}`,
    );
  });
});
