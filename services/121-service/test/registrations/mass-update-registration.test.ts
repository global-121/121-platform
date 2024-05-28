import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { assertRegistrationImport } from '@121-service/test/helpers/assert.helper';
import {
  bulkUpdateRegistrationsCSV,
  importRegistrationsCSV,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Update attribute of multiple PAs via Bulk update', () => {
  const programIdOcw = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-OCW.csv',
      accessToken,
    );
  });

  it('Should bulk update and validate changed records', async () => {
    const registrationDataThatWillChangePa1 = {
      phoneNumber: '14155238880',
      fullName: 'updated name1',
      addressStreet: 'newStreet1',
      addressHouseNumber: '2',
      addressHouseNumberAddition: '',
    };
    const registrationDataThatWillChangePa2 = {
      phoneNumber: '14155238881',
      fullName: 'updated name 2',
      addressStreet: 'newStreet2',
      addressHouseNumber: '3',
      addressHouseNumberAddition: 'updated',
    };

    // Act
    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-patch-OCW.csv',
      accessToken,
      'Bulk update for test registrations due to data validation improvements',
    );
    expect(bulkUpdateResult.statusCode).toBe(200);
    await waitFor(2000);

    const searchByReferenceIdAfterPatchPa1 =
      await searchRegistrationByReferenceId(
        '00dc9451-1273-484c-b2e8-ae21b51a96ab',
        programIdOcw,
        accessToken,
      );

    const pa1AfterPatch = searchByReferenceIdAfterPatchPa1.body.data[0];

    const searchByReferenceIdAfterPatchPa2 =
      await searchRegistrationByReferenceId(
        '01dc9451-1273-484c-b2e8-ae21b51a96ab',
        programIdOcw,
        accessToken,
      );

    const pa2AfterPatch = searchByReferenceIdAfterPatchPa2.body.data[0];

    // Assert
    assertRegistrationImport(pa1AfterPatch, registrationDataThatWillChangePa1);
    assertRegistrationImport(pa2AfterPatch, registrationDataThatWillChangePa2);
  });

  it('Should bulk update if phoneNumber column is empty and program is configured as not allowing empty phone number', async () => {
    const registrationDataThatWillChangePa1 = {
      phoneNumber: '14155238886',
      fullName: 'updated name1',
      addressStreet: 'newStreet1',
      addressHouseNumber: '2',
      addressHouseNumberAddition: '',
    };
    const registrationDataThatWillChangePa2 = {
      phoneNumber: '14155238886',
      fullName: 'updated name 2',
      addressStreet: 'newStreet2',
      addressHouseNumber: '3',
      addressHouseNumberAddition: 'updated',
    };

    // Act
    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-patch-OCW-without-phoneNumber-column.csv',
      accessToken,
      'Bulk update for test registrations due to data validation improvements',
    );
    expect(bulkUpdateResult.statusCode).toBe(200);

    await waitFor(2000);

    const searchByReferenceIdAfterPatchPa1 =
      await searchRegistrationByReferenceId(
        '00dc9451-1273-484c-b2e8-ae21b51a96ab',
        programIdOcw,
        accessToken,
      );
    const pa1AfterPatch = searchByReferenceIdAfterPatchPa1.body.data[0];

    const searchByReferenceIdAfterPatchPa2 =
      await searchRegistrationByReferenceId(
        '01dc9451-1273-484c-b2e8-ae21b51a96ab',
        programIdOcw,
        accessToken,
      );
    const pa2AfterPatch = searchByReferenceIdAfterPatchPa2.body.data[0];

    // Assert
    assertRegistrationImport(pa1AfterPatch, registrationDataThatWillChangePa1);
    assertRegistrationImport(pa2AfterPatch, registrationDataThatWillChangePa2);
  });
});
