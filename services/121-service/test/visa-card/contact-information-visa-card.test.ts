import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  projectIdVisa,
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

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should update phone number before and after changing FSP configuration from Visa', async () => {
    // Arrange
    await seedPaidRegistrations([registrationVisa], projectIdVisa);

    // Act
    const responseUpdateBeforeFspChange = await updateRegistration(
      projectIdVisa,
      registrationVisa.referenceId,
      {
        phoneNumber: '123456789',
      },
      'test',
      accessToken,
    );

    await updateRegistration(
      projectIdVisa,
      registrationVisa.referenceId,
      {
        projectFspConfigurationName: 'Intersolve-voucher-whatsapp',
      },
      'test',
      accessToken,
    );

    const responseUpdateAfterFspChange = await updateRegistration(
      projectIdVisa,
      registrationVisa.referenceId,
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
