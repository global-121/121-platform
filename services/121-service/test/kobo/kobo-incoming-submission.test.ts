import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submissions';
import {
  postKoboToProgram,
  triggerKoboSubmission,
} from '@121-service/test/helpers/kobo.helper';
import {
  postMessageTemplate,
  postProgram,
  waitForMessagesToComplete,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getMessageHistory,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
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

describe('Process incoming Kobo submission via webhook', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.productionInitialState, __filename);
    accessToken = await getAccessToken();
  });

  async function setupProgramWithKoboIntegration(assetUid: string): Promise<{
    programId: number;
    assetUid: string;
  }> {
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program with Kobo integration for webhook testing',
      },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;

    await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetUid,
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
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

    return { programId, assetUid };
  }

  it('should successfully process an incoming Kobo submission and create a registration', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.success}-happy-flow`;
    const { programId, assetUid } = await setupProgramWithKoboIntegration(
      'success-asset-happy-flow',
    );

    // Act
    const triggerSubmissionResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    // Assert
    expect(triggerSubmissionResponse.status).toBe(HttpStatus.OK);
    expect(triggerSubmissionResponse.body).toMatchObject({
      message: 'Webhook triggered successfully',
      submissionUuid,
    });

    // Verify the registration was created
    const searchResponse = await searchRegistrationByReferenceId(
      submissionUuid,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toHaveLength(1);
    const registration = searchResponse.body.data[0];
    expect(registration).toMatchObject({
      referenceId: submissionUuid,
      fullName: 'John Doe',
      nationalId: '123456789',
      phoneNumber: '+31612345678',
    });

    // Verify the system sent a 'new registration' message (rather than a user)
    await waitForMessagesToComplete({
      programId,
      referenceIds: [submissionUuid],
      accessToken,
      expectedMessageAttribute: {
        key: 'contentType',
        values: [MessageContentType.new],
      },
    });

    const messageHistory = (
      await getMessageHistory(programId, submissionUuid, accessToken)
    ).body;
    expect(messageHistory).toHaveLength(1);
    expect(messageHistory[0].attributes.contentType).toBe(
      MessageContentType.new,
    );
    expect(messageHistory[0].user.id).toBeUndefined();
    expect(messageHistory[0].user.username).toBeUndefined();
  });

  it('should fail to process an incoming Kobo submission when the submission is invalid', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.failure}-invalid-fsp`;
    const { programId, assetUid } = await setupProgramWithKoboIntegration(
      'success-asset-invalid-fsp',
    );

    // Act
    const triggerSubmissionResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    // Assert
    // The mock service forwarded the error it received from 121-service
    // This is similar of how it would behave in production, where Kobo would receive an error response if the submission processing fails
    // Kobo user would be able to see this error in the Kobo Rest service logs, which can be used for troubleshooting
    expect(triggerSubmissionResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(triggerSubmissionResponse.body[0].error).toBe(
      'FspConfigurationName Invalid-FSP not found in program. Allowed values: Safaricom',
    );

    //  no registration was created
    const searchResponse = await searchRegistrationByReferenceId(
      submissionUuid,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toHaveLength(0);
  });

  it('should return not found when the asset UID is unknown', async () => {
    // This test simulates an external actor — e.g. someone who discovered our
    // webhook endpoint — calling it with a made-up asset UID that does not
    // correspond to any Kobo integration stored in the 121-service database.
    // In these cases, the 121-service should reject the request with a 404

    // Arrange
    const unknownAssetUid = 'made-up-asset-uid-that-does-not-exist';
    const submissionUuid = `${KoboMockSubmissionUuids.success}-unknown-asset`;

    // Act
    const triggerSubmissionResponse = await triggerKoboSubmission({
      assetUid: unknownAssetUid,
      submissionUuid,
    });

    // Assert: 121-service returned a 404 and the mock service forwarded it
    expect(triggerSubmissionResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(triggerSubmissionResponse.body.message).toBe(
      'Kobo integration not found for this program',
    );
  });

  it('should reject a duplicate submission with the same referenceId', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.success}-duplicate`;
    const { programId, assetUid } = await setupProgramWithKoboIntegration(
      'success-asset-duplicate',
    );

    // Act: submit the same submission twice
    await triggerKoboSubmission({ assetUid, submissionUuid });
    const secondResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    expect(secondResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(secondResponse.body[0].error).toBe(
      'referenceId already exists in database',
    );

    // Verify only one registration exists
    const searchResponse = await searchRegistrationByReferenceId(
      submissionUuid,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toHaveLength(1);
  });
});
