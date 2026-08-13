import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Sync contact information for all Intersolve Visa customers', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should send contact information for all Intersolve customers', async () => {
    // Arrange
    await seedPaidRegistrations({
      registrations: [
        {
          ...registrationVisa,
          referenceId: 'test-sync-contact-information-all',
          whatsappPhoneNumber: registrationVisa.phoneNumber,
        },
      ],
      programId: programIdVisa,
    });

    // Act
    const response = await getServer()
      .post('/fsps/intersolve-visa/contact-information')
      .set('Cookie', [accessToken])
      .send({ limit: 10 });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.syncedCustomers).toBeGreaterThanOrEqual(1);
  });
});
