import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submission-uuids';
import {
  setupProgramWithKoboIntegration,
  triggerKoboSubmission,
} from '@121-service/test/helpers/kobo.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const fspConfiguration: CreateProgramFspConfigurationDto = {
  name: 'Safaricom',
  label: { en: 'Safaricom' },
  fspName: Fsps.safaricom,
  properties: [],
};

const baseProgram: Partial<CreateProgramDto> = {
  currency: CurrencyCode.EUR,
  enableMaxPayments: true,
  fixedTransferValue: 20,
  programRegistrationAttributes: [
    {
      name: FspAttributes.nationalId,
      label: { en: 'National ID' },
      type: RegistrationAttributeTypes.text,
      options: [],
    },
  ],
};

describe('Download Kobo image for a registration', () => {
  let accessToken: string;
  let programId: number;
  const submissionUuid = `${KoboMockSubmissionUuids.success}-kobo-image-test`;
  const assetUidInput = 'success-asset-kobo-image';

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();

    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program for Kobo image download testing' },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const setup = await setupProgramWithKoboIntegration({
      assetUid: assetUidInput,
      program,
      fspConfiguration,
      accessToken,
    });
    programId = setup.programId;

    // Create a registration via Kobo webhook (which stores the image attachment URL)
    await triggerKoboSubmission({
      assetUid: setup.assetUid,
      submissionUuid,
      koboVersion: KoboMockAssetUids.happyFlow,
    });
  });

  it('should stream the image bytes with correct content-type', async () => {
    // Act
    const response = await getServer()
      .get(
        `/programs/${programId}/registrations/${submissionUuid}/kobo-images/photo`,
      )
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers['content-type']).toContain('image/jpeg');
    expect(response.body).toBeInstanceOf(Buffer);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should return 404 when the registration does not exist', async () => {
    // Act
    const response = await getServer()
      .get(
        `/programs/${programId}/registrations/non-existent-ref-id/kobo-images/photo`,
      )
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 404 when the attribute is not a koboImage type', async () => {
    // Act
    const response = await getServer()
      .get(
        `/programs/${programId}/registrations/${submissionUuid}/kobo-images/fullName`,
      )
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 404 when the attribute does not exist on the program', async () => {
    // Act
    const response = await getServer()
      .get(
        `/programs/${programId}/registrations/${submissionUuid}/kobo-images/nonExistentAttribute`,
      )
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 404 when no Kobo integration exists for the program', async () => {
    // Arrange - create a program without Kobo integration
    const programWithoutKobo: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program without Kobo' },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const createResponse = await getServer()
      .post('/programs')
      .set('Cookie', [accessToken])
      .send(programWithoutKobo);
    const programWithoutKoboId = createResponse.body.id;

    // Act
    const response = await getServer()
      .get(
        `/programs/${programWithoutKoboId}/registrations/${submissionUuid}/kobo-images/photo`,
      )
      .set('Cookie', [accessToken]);

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
