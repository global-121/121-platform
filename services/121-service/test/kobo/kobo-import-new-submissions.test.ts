import { HttpStatus } from '@nestjs/common';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submission-uuids';
import {
  patchKoboSubmissions,
  setupProgramWithKoboIntegration,
} from '@121-service/test/helpers/kobo.helper';
import { postMessageTemplate } from '@121-service/test/helpers/program.helper';
import { searchRegistrationByReferenceId } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const createProgramFspConfigurationSafaricomDto: CreateProgramFspConfigurationDto =
  {
    name: 'Safaricom',
    label: {
      en: 'Safaricom',
    },
    fspName: Fsps.safaricom,
    properties: [],
  };

const requiredProgramRegistrationAttributesForSafaricom = [
  {
    name: FspAttributes.nationalId,
    label: {
      en: 'National ID',
    },
    type: RegistrationAttributeTypes.text,
    options: [],
  },
];

const baseProgram: Partial<CreateProgramDto> = {
  currency: CurrencyCode.EUR,
  enableMaxPayments: true,
  fixedTransferValue: 20,
  programRegistrationAttributes:
    requiredProgramRegistrationAttributesForSafaricom,
};

describe('Import new Kobo submissions via PATCH endpoint', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.productionInitialState, __filename);
    accessToken = await getAccessToken();
  });

  async function setup(assetUid: string): Promise<{
    programId: number;
    assetUid: string;
  }> {
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program with Kobo integration for import testing',
      },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const { programId, assetUid: uid } = await setupProgramWithKoboIntegration({
      assetUid,
      program,
      fspConfiguration: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    await postMessageTemplate(
      programId,
      {
        type: MessageContentType.new,
        language: RegistrationPreferredLanguage.en,
        label: { en: 'New registration' },
        message: 'Welcome to our program.',
        isSendMessageTemplate: false,
      },
      accessToken,
    );

    return { programId, assetUid: uid };
  }

  it('should import new submissions and create registrations', async () => {
    // Arrange
    const assetUid = 'import-happy-flow';
    const expectedReferenceId = `${KoboMockSubmissionUuids.success}-${assetUid}`;
    const { programId } = await setup(assetUid);

    // Act
    const response = await patchKoboSubmissions({ programId, accessToken });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.aggregateImportResult.countImported).toBe(1);

    const searchResponse = await searchRegistrationByReferenceId(
      expectedReferenceId,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
    expect(searchResponse.body.data[0]).toMatchObject({
      referenceId: expectedReferenceId,
      fullName: 'John Doe',
      nationalId: '123456789',
      phoneNumber: '+31612345678',
    });
  });

  it('should not import submissions that already exist', async () => {
    // Arrange
    const assetUid = 'import-duplicate';
    const expectedReferenceId = `${KoboMockSubmissionUuids.success}-${assetUid}`;
    const { programId } = await setup(assetUid);

    const firstResponse = await patchKoboSubmissions({
      programId,
      accessToken,
    });
    expect(firstResponse.status).toBe(HttpStatus.OK);
    expect(firstResponse.body.aggregateImportResult.countImported).toBe(1);

    // Act: Import a second time — the same submission already exists
    const secondResponse = await patchKoboSubmissions({
      programId,
      accessToken,
    });

    // Assert
    expect(secondResponse.status).toBe(HttpStatus.OK);
    expect(secondResponse.body.aggregateImportResult.countImported).toBe(0);

    const searchResponse = await searchRegistrationByReferenceId(
      expectedReferenceId,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
  });
});
