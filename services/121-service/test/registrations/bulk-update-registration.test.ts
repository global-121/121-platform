import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  bulkUpdateRegistrationsCSV,
  importRegistrationsCSV,
  searchRegistrationByReferenceId,
  waitForBulkRegistrationChanges,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

function filterUnchangedProperties(
  originalData: Record<string, unknown>,
  patchData: Record<string, unknown>,
): Record<string, any> {
  const unchangedProperties: Record<string, unknown> = {};

  for (const key of Object.keys(originalData)) {
    // these attrs are special cases: they are derived properties so they cannot be patched
    if (
      !(key in patchData) &&
      key !== 'name' &&
      key !== 'duplicateStatus' &&
      key !== 'lastMessageStatus'
    ) {
      unchangedProperties[key] = originalData[key];
    }
  }

  return unchangedProperties;
}

describe('Update attribute of multiple PAs via Bulk update', () => {
  const programIdOcw = 3;

  let accessToken: string;
  const referenceId1 = '00dc9451-1273-484c-b2e8-ae21b51a96ab';
  const referenceId2 = '01dc9451-1273-484c-b2e8-ae21b51a96ab';

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-OCW.csv',
      accessToken,
    );
  });

  it('Should bulk update and validate changed records', async () => {
    const registrationDataThatWillChangePa1 = {
      fullName: 'updated name1',
      addressStreet: 'newStreet1',
      addressHouseNumber: '2',
      addressHouseNumberAddition: null,
      preferredLanguage: 'ar',
      paymentAmountMultiplier: 2,
      phoneNumber: '31612345678',
    };
    const registrationDataThatWillChangePa2 = {
      fullName: 'updated name 2',
      addressStreet: 'newStreet2',
      addressHouseNumber: '3',
      addressHouseNumberAddition: 'updated',
      preferredLanguage: 'nl',
      paymentAmountMultiplier: 3,
      phoneNumber: '31687654321',
    };

    // Registration before patch
    const searchByReferenceIdBeforePatchPa1 =
      await searchRegistrationByReferenceId(
        referenceId1,
        programIdOcw,
        accessToken,
      );
    const pa1BeforePatch = searchByReferenceIdBeforePatchPa1.body.data[0];

    const searchByReferenceIdBeforePatchPa2 =
      await searchRegistrationByReferenceId(
        referenceId2,
        programIdOcw,
        accessToken,
      );
    const pa2BeforePatch = searchByReferenceIdBeforePatchPa2.body.data[0];

    // Act
    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-patch-OCW.csv',
      accessToken,
      'test-reason',
    );
    expect(bulkUpdateResult.statusCode).toBe(200);

    await waitForBulkRegistrationChanges(
      [
        {
          referenceId: referenceId1,
          expectedPatch: registrationDataThatWillChangePa1,
        },
        {
          referenceId: referenceId2,
          expectedPatch: registrationDataThatWillChangePa2,
        },
      ],
      programIdOcw,
      accessToken,
    );

    const searchByReferenceIdAfterPatchPa1 =
      await searchRegistrationByReferenceId(
        referenceId1,
        programIdOcw,
        accessToken,
      );

    const pa1AfterPatch = searchByReferenceIdAfterPatchPa1.body.data[0];

    const searchByReferenceIdAfterPatchPa2 =
      await searchRegistrationByReferenceId(
        referenceId2,
        programIdOcw,
        accessToken,
      );

    const pa2AfterPatch = searchByReferenceIdAfterPatchPa2.body.data[0];

    // Assert
    // Explicit assertions for pa1 using patch data
    expect(pa1AfterPatch).toMatchObject(registrationDataThatWillChangePa1);

    // Explicit assertions for pa2 using patch data
    expect(pa2AfterPatch).toMatchObject(registrationDataThatWillChangePa2);

    // Ensure unchanged fields remain the same
    const dataThatStaysTheSamePa1 = filterUnchangedProperties(
      pa1BeforePatch,
      registrationDataThatWillChangePa1,
    );

    const dataThatStaysTheSamePa2 = filterUnchangedProperties(
      pa2BeforePatch,
      registrationDataThatWillChangePa2,
    );

    expect(pa1AfterPatch).toMatchObject(dataThatStaysTheSamePa1);
    expect(pa2AfterPatch).toMatchObject(dataThatStaysTheSamePa2);
  });

  it('Should bulk update chosen FSP and validate changed records', async () => {
    const registrationDataThatWillChangePa1 = {
      fspName: 'Intersolve-voucher-whatsapp',
      programFspConfigurationId: 5,
      programFspConfigurationName: 'Intersolve-voucher-whatsapp',
      programFspConfigurationLabel: {
        en: 'Albert Heijn voucher WhatsApp',
      },
    };
    const registrationDataThatWillChangePa2 = {
      fspName: 'Intersolve-visa',
      programFspConfigurationId: 6,
      programFspConfigurationName: 'Intersolve-visa',
      programFspConfigurationLabel: {
        en: 'Visa debit card',
      },
    };

    // Registration before patch
    const searchByReferenceIdBeforePatchPa1 =
      await searchRegistrationByReferenceId(
        referenceId1,
        programIdOcw,
        accessToken,
      );
    const pa1BeforePatch = searchByReferenceIdBeforePatchPa1.body.data[0];

    const searchByReferenceIdBeforePatchPa2 =
      await searchRegistrationByReferenceId(
        referenceId2,
        programIdOcw,
        accessToken,
      );
    const pa2BeforePatch = searchByReferenceIdBeforePatchPa2.body.data[0];

    // Act
    const bulkUpdateResult = await bulkUpdateRegistrationsCSV(
      programIdOcw,
      './test-registration-data/test-registrations-patch-OCW-chosen-FSP.csv',
      accessToken,
      'test-reason',
    );
    expect(bulkUpdateResult.statusCode).toBe(200);

    await waitForBulkRegistrationChanges(
      [
        {
          referenceId: referenceId1,
          expectedPatch: registrationDataThatWillChangePa1,
        },
        {
          referenceId: referenceId2,
          expectedPatch: registrationDataThatWillChangePa2,
        },
      ],
      programIdOcw,
      accessToken,
    );

    const searchByReferenceIdAfterPatchPa1 =
      await searchRegistrationByReferenceId(
        referenceId1,
        programIdOcw,
        accessToken,
      );

    const pa1AfterPatch = searchByReferenceIdAfterPatchPa1.body.data[0];

    const searchByReferenceIdAfterPatchPa2 =
      await searchRegistrationByReferenceId(
        referenceId2,
        programIdOcw,
        accessToken,
      );

    const pa2AfterPatch = searchByReferenceIdAfterPatchPa2.body.data[0];

    // Assert
    // Explicit assertions for pa1 using patch data
    expect(pa1AfterPatch).toMatchObject(registrationDataThatWillChangePa1);

    // Explicit assertions for pa2 using patch data
    expect(pa2AfterPatch).toMatchObject(registrationDataThatWillChangePa2);

    // Ensure unchanged fields remain the same
    const dataThatStaysTheSamePa1 = filterUnchangedProperties(
      pa1BeforePatch,
      registrationDataThatWillChangePa1,
    );

    const dataThatStaysTheSamePa2 = filterUnchangedProperties(
      pa2BeforePatch,
      registrationDataThatWillChangePa2,
    );

    expect(pa1AfterPatch).toMatchObject(dataThatStaysTheSamePa1);
    expect(pa2AfterPatch).toMatchObject(dataThatStaysTheSamePa2);
  });
});
