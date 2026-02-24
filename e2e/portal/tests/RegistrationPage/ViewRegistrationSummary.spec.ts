import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { searchRegistrationByReferenceId } from '@121-service/test/helpers/registration.helper';
import { registrationPvScoped } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 2;
let registrationId: number;
let registrationProgramId: number;

test('User should see a summary of a registration', async ({
  registrationActivityLogPage,
  resetDBAndSeedRegistrations,
  accessToken,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: [registrationPvScoped],
    programId,
  });

  const searchRegistrationResponse = await searchRegistrationByReferenceId(
    registrationPvScoped.referenceId,
    programId,
    accessToken,
  );
  const registration = searchRegistrationResponse.body.data[0];
  registrationId = registration.id;
  registrationProgramId = registration.registrationProgramId;

  await registrationActivityLogPage.goto(
    `/program/${programId}/registrations/${registrationId}`,
  );

  await test.step('Validate registration title', async () => {
    const title = await registrationActivityLogPage.getRegistrationTitle();
    const expectedTitle = `Reg. #${registrationProgramId} - ${registrationPvScoped.fullName}`;
    expect(title).toBe(expectedTitle);
  });

  await test.step('Validate registration summary table labels and values', async () => {
    const expectedValueObject = {
      'Registration Status': 'Included',
      Payments: '1',
      'Phone number': registrationPvScoped.phoneNumber,
      Scope: registrationPvScoped.scope,
    };
    const receivedValueObject =
      await registrationActivityLogPage.getRegistrationSummaryList();
    expect(receivedValueObject).toMatchObject(expectedValueObject);
  });

  await test.step('Validate registration created date', async () => {
    const dateText =
      await registrationActivityLogPage.getRegistrationCreatedDate();
    // Simple pattern validation for DD/MM/YYYY
    const dateFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    expect(dateFormatRegex.test(dateText)).toBeTruthy();
  });
});
