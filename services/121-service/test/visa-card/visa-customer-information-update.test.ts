import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Update registration data of registration with visa customer', () => {
  let accessToken: string;
  let registrationVisaCopy: typeof registrationVisa;

  beforeEach(async () => {
    registrationVisaCopy = { ...registrationVisa };
    registrationVisaCopy.referenceId = `test-reg-${Date.now()}`; // Make sure referenceId is unique for each test run this is useful when testing with the intersolve acceptance server
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  // When user update certain fields of a registration with a visa customer the 121-platform should update the visa customer with API calls to Intersolve
  // It's very hard to properly create automated tests for this functionality as the end result are API request to Intersolve.
  // When running API tests we have MOCK_INTERSOLVE=true in our env, which mean we make our API requests to our mock-service, which pretends to be Intersolve.
  // We have no way to easily validate if the mock service is properly called, so we only check if no errors are thrown when updating a registration with a visa customer.
  it('should get a success response when updating registration data of a registration with a visa customer', async () => {
    // Arrange
    await seedPaidRegistrations([registrationVisaCopy], programIdVisa);

    // Act
    const responseUpdateBeforeFspChange = await updateRegistration(
      programIdVisa,
      registrationVisaCopy.referenceId,
      {
        phoneNumber: '123456789',
      },
      'test',
      accessToken,
    );

    await updateRegistration(
      programIdVisa,
      registrationVisaCopy.referenceId,
      {
        programFspConfigurationName: 'Intersolve-voucher-whatsapp',
      },
      'test',
      accessToken,
    );

    // Even if a registrations FSP is changed, if a visa customer exists, the visa customer is still updated
    const responseUpdateAfterFspChange = await updateRegistration(
      programIdVisa,
      registrationVisaCopy.referenceId,
      {
        phoneNumber: '987654321',
      },
      'test',
      accessToken,
    );

    // Assert
    expect(responseUpdateBeforeFspChange.status).toBe(HttpStatus.OK);
    expect(responseUpdateAfterFspChange.status).toBe(HttpStatus.OK);
  });
});
