import { HttpStatus } from '@nestjs/common';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
} from '@121-service/test/helpers/program.helper';
import {
  deleteProgramFspConfigurationProperty,
  postProgramFspConfigurationProperties,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
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

  it('should return 400 when creating a payment with name longer than 60 characters', async () => {
    // Arrange
    const nameWith61Characters = 'a'.repeat(61);

    // Act
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: nameWith61Characters,
    });
    // Assert
    expect(createResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return 201 when creating a payment with name of exactly 60 characters', async () => {
    // Arrange
    const nameWith60Characters = 'a'.repeat(60);

    // Act
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: nameWith60Characters,
    });
    // Assert
    expect(createResponse.status).toBe(HttpStatus.CREATED);
  });

  it('should reject creating a payment when the FSP configuration is pending', async () => {
    // Arrange - remove a required property so the FSP configuration becomes pending
    await deleteProgramFspConfigurationProperty({
      programId,
      configName: Fsps.intersolveVoucherWhatsapp,
      propertyName: FspConfigurationProperties.password,
      accessToken,
    });

    try {
      // Act
      const createResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: [registrationPV5.referenceId],
        accessToken,
      });

      // Assert
      expect(createResponse.status).toBe(HttpStatus.BAD_REQUEST);
      expect(createResponse.body.message).toBe(
        `Program FSP configuration ${Fsps.intersolveVoucherWhatsapp} is not fully configured`,
      );
    } finally {
      // Restore the property so other tests (run in random order) see a configured FSP again
      await postProgramFspConfigurationProperties({
        programId,
        name: Fsps.intersolveVoucherWhatsapp,
        properties: [
          {
            name: FspConfigurationProperties.password,
            value: 'restored-password',
          },
        ],
        accessToken,
      });
    }
  });
});
