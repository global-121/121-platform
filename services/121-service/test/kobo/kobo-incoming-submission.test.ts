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
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submissions';
import {
  setupProgramWithKoboIntegration,
  triggerKoboSubmission,
} from '@121-service/test/helpers/kobo.helper';
import {
  postMessageTemplate,
  waitForMessagesToComplete,
} from '@121-service/test/helpers/program.helper';
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

  async function setup(assetUid: string): Promise<{
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

  it('should successfully process an incoming Kobo submission and create a registration', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.success}-happy-flow`;
    const { programId, assetUid } = await setup('success-asset-happy-flow');

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
    expect(searchResponse.body.data).toBeArrayOfSize(1);
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
    const { attributes, user } = messageHistory[0];
    expect(attributes.contentType).toBe(MessageContentType.new);
    expect(user.id).toBeUndefined();
    expect(user.username).toBeUndefined();
  });

  it('should fail to process an incoming Kobo submission when the submission is invalid', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.failure}-invalid-fsp`;
    const { programId, assetUid } = await setup('success-asset-invalid-fsp');

    // Act
    const triggerSubmissionResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    // Assert
    // This is similar of how it would behave in production, where Kobo would receive an error response if the submission processing fails
    // Kobo user would be able to see this error in the Kobo Rest service logs, which can be used for troubleshooting
    // The mock service returns the error it receives from 121-service, so we can test that the 121-service returns the correct error
    expect(triggerSubmissionResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(triggerSubmissionResponse.body[0].error).toMatchInlineSnapshot(
      `"FspConfigurationName Invalid-FSP not found in program. Allowed values: Safaricom"`,
    );

    //  no registration was created
    const searchResponse = await searchRegistrationByReferenceId(
      submissionUuid,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(0);
  });

  it('should return not found when the submission UID is unknown', async () => {
    // This test simulates an external actor — e.g. someone who discovered our
    // webhook endpoint — calling it with a made-up Submission uid that does not
    // correspond to any Kobo submission
    // In these cases, the 121-service should reject the request with a 404

    // Arrange
    const { assetUid } = await setup('success-asset-submission-not-found');

    const submissionUuid = `unknown-asset`;

    // Act
    const triggerSubmissionResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    // Assert: 121-service returned a 404 and the mock service forwarded it
    expect(triggerSubmissionResponse.status).toBe(HttpStatus.NOT_FOUND);
    // Not using inline snapshot for the error message, as it contains the url which can differ based on the environment
    expect(triggerSubmissionResponse.body.message).toContain(
      'Kobo submission not found for asset: success-asset-submission-not-found, url:',
    );
  });

  it('should reject a duplicate submission with the same referenceId', async () => {
    // Arrange
    const submissionUuid = `${KoboMockSubmissionUuids.success}-duplicate`;
    const { programId, assetUid } = await setup('success-asset-duplicate');

    // Act: submit the same submission twice
    await triggerKoboSubmission({ assetUid, submissionUuid });
    const secondResponse = await triggerKoboSubmission({
      assetUid,
      submissionUuid,
    });

    expect(secondResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(secondResponse.body[0].error).toMatchInlineSnapshot(
      `"referenceId already exists in database"`,
    );

    // Verify only one registration exists
    const searchResponse = await searchRegistrationByReferenceId(
      submissionUuid,
      programId,
      accessToken,
    );
    expect(searchResponse.body.data).toBeArrayOfSize(1);
  });
});
