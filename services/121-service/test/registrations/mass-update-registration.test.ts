import { SeedScript } from '../../src/scripts/seed-script.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import { assertRegistrationImport } from '../helpers/assert.helper';
import {
  bulkUpdateRegistrationsCSV,
  importRegistrationsCSV,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Update attribute of multiple PAs via Bulk update', () => {
  const programIdOcw = 3;

  let accessToken: string;

  beforeEach(async () => {
    const PA1 = {
      phoneNumber: '14155238886',
      lastName: 'succeed',
      addressStreet: 'Straat',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
    };
    const PA2 = {
      phoneNumber: '14155238886',
      lastName: 'mock-fail-create-customer',
      addressStreet: 'Straat',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
    };

    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-OCW.csv',
      accessToken,
    );

    const pa1result = await searchRegistrationByReferenceId(
      '00dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa1response = pa1result.body.data[0];
    assertRegistrationImport(pa1response, PA1);

    const pa2result = await searchRegistrationByReferenceId(
      '01dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa2response = pa2result.body.data[0];
    assertRegistrationImport(pa2response, PA2);
  });

  it('Should bulk update and validate changed records', async () => {
    const PA1Patch = {
      phoneNumber: '14155238880',
      lastName: 'updated name1',
      addressStreet: 'newStreet1',
      addressHouseNumber: '2',
      addressHouseNumberAddition: '',
    };
    const PA2Patch = {
      phoneNumber: '14155238881',
      lastName: 'updated name 2',
      addressStreet: 'newStreet2',
      addressHouseNumber: '3',
      addressHouseNumberAddition: 'updated',
    };

    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-patch-OCW.csv',
      accessToken,
    );
    expect(bulkUpdateResult.statusCode).toBe(200);

    // TODO: refactor test to not rely on aribtrary pause
    await waitFor(2000);

    const pa1patched = await searchRegistrationByReferenceId(
      '00dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa1patchedResponse = pa1patched.body.data[0];
    assertRegistrationImport(pa1patchedResponse, PA1Patch);

    const pa2patched = await searchRegistrationByReferenceId(
      '01dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa2patchedResponse = pa2patched.body.data[0];
    assertRegistrationImport(pa2patchedResponse, PA2Patch);
  });
});
