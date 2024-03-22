import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { waitFor } from '../../src/utils/waitFor.helper';
import {
  searchRegistrationByReferenceId,
  importRegistrationsCSV,
  bulkUpdateRegistrationsCSV,
} from '../helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '../helpers/utility.helper';

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

    const importCsvPAs = await importRegistrationsCSV(programIdOcw, './test-registration-data/test-registrations-OCW.csv', accessToken);
    expect(importCsvPAs.statusCode).toBe(201);

    const pa1result = await searchRegistrationByReferenceId(
      '00dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa1response = pa1result.body.data[0];

    expect(pa1result.statusCode).toBe(HttpStatus.OK);
    expect(pa1response.phoneNumber).toBe(PA1.phoneNumber);
    expect(pa1response.lastName).toBe(PA1.lastName);
    expect(pa1response.addressStreet).toBe(PA1.addressStreet);
    expect(pa1response.addressHouseNumber).toBe(PA1.addressHouseNumber);
    expect(pa1response.addressHouseNumberAddition).toBe(PA1.addressHouseNumberAddition);

    const pa2result = await searchRegistrationByReferenceId(
      '01dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa2response = pa2result.body.data[0];

    expect(pa2result.statusCode).toBe(HttpStatus.OK);
    expect(pa2response.phoneNumber).toBe(PA2.phoneNumber);
    expect(pa2response.lastName).toBe(PA2.lastName);
    expect(pa2response.addressStreet).toBe(PA2.addressStreet);
    expect(pa2response.addressHouseNumber).toBe(PA2.addressHouseNumber);
    expect(pa2response.addressHouseNumberAddition).toBe(PA2.addressHouseNumberAddition);
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

    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(programIdOcw, './test-registration-data/test-registrations-patch-OCW.csv', accessToken);
    expect(bulkUpdateResult.statusCode).toBe(200);

    await waitFor(2000);

    const pa1patched = await searchRegistrationByReferenceId(
      '00dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa1patchedResponse = pa1patched.body.data[0];

    expect(pa1patched.statusCode).toBe(HttpStatus.OK);
    expect(pa1patchedResponse.phoneNumber).toBe(PA1Patch.phoneNumber);
    expect(pa1patchedResponse.lastName).toBe(PA1Patch.lastName);
    expect(pa1patchedResponse.addressStreet).toBe(PA1Patch.addressStreet);
    expect(pa1patchedResponse.addressHouseNumber).toBe(PA1Patch.addressHouseNumber);
    expect(pa1patchedResponse.addressHouseNumberAddition).toBe(PA1Patch.addressHouseNumberAddition);

    const pa2patched = await searchRegistrationByReferenceId(
      '01dc9451-1273-484c-b2e8-ae21b51a96ab',
      programIdOcw,
      accessToken,
    );

    const pa2patchedResponse = pa2patched.body.data[0];

    expect(pa2patched.statusCode).toBe(HttpStatus.OK);
    expect(pa2patchedResponse.phoneNumber).toBe(PA2Patch.phoneNumber);
    expect(pa2patchedResponse.lastName).toBe(PA2Patch.lastName);
    expect(pa2patchedResponse.addressStreet).toBe(PA2Patch.addressStreet);
    expect(pa2patchedResponse.addressHouseNumber).toBe(PA2Patch.addressHouseNumber);
    expect(pa2patchedResponse.addressHouseNumberAddition).toBe(PA2Patch.addressHouseNumberAddition);

    console.log('Bulk update and revalidate successful!');
  });
});
