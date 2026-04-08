import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Create payment', () => {
  const programId = programIdPV;
  const transferValue = 25;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({seedScript: SeedScript.nlrcMultiple});
    accessToken = await getAccessToken();
    await seedIncludedRegistrations([registrationPV5], programId, accessToken);
  });

  it('should return 400 when creating a payment with name as null', async () => {
    // Act
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: null as unknown as string,
    });
    // Assert
    expect(createResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return 400 when creating a payment with empty name', async () => {
    // Act
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: '',
    });
    // Assert
    expect(createResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return 400 when creating a payment with whitespace-only name', async () => {
    // Act
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: '   ',
    });
    // Assert
    expect(createResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
