import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { CreateKoboDto } from '@121-service/src/kobo/dtos/create-kobo.dto';
import { CreateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/create-program-fsp-configuration.dto';
import { CreateProgramDto } from '@121-service/src/programs/dto/create-program.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { KoboMockSubmissionUuids } from '@121-service/test/fixtures/kobo-mock-submissions';
import { postKoboToProgram } from '@121-service/test/helpers/kobo.helper';
import { postProgram } from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  getServer,
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

describe('Kobo webhook Basic auth guard', () => {
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
      titlePortal: { en: 'Program with Kobo integration for auth testing' },
      languages: [RegistrationPreferredLanguage.en],
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

    return { programId, assetUid };
  }

  function basicAuthHeader(username: string, password: string): string {
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  it('should accept a webhook request with valid Basic auth credentials', async () => {
    // Arrange
    const { assetUid } = await setupProgramWithKoboIntegration(
      'auth-test-asset-valid',
    );
    const submissionUuid = `${KoboMockSubmissionUuids.success}-auth-valid`;

    // Act – call the webhook endpoint directly with the dev dummy credentials
    // that `canActivateWithDevelopmentCredentials` accepts.
    // In production this path would be handled by comparing the supplied
    // credentials against the stored `webhookAuthUsername` / `webhookAuthPassword`
    // columns (the last `if` in `canActivate`).
    // In development we cannot access the KoboEntity to store/retrieve the generated credentials, so we use fixed dummy credentials
    const response = await getServer()
      .post('/kobo/webhook')
      .set('Authorization', basicAuthHeader('success', 'success'))
      .send({
        _uuid: submissionUuid,
        _xform_id_string: assetUid,
      });

    // Assert
    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it('should reject a webhook request with invalid Basic auth credentials', async () => {
    // Arrange
    const { assetUid } = await setupProgramWithKoboIntegration(
      'auth-test-asset-invalid',
    );
    const submissionUuid = `${KoboMockSubmissionUuids.success}-auth-invalid`;

    // Act – call the webhook endpoint directly with wrong credentials.
    // In development (`IS_DEVELOPMENT = true`) the `canActivateWithDevelopmentCredentials`
    // helper rejects anything other than `success:success` or `failure:failure`.
    // In production this code path reaches the final
    // `if (username !== koboEntity.webhookAuthUsername || password !== koboEntity.webhookAuthPassword)`
    // check in `canActivate` and throws the same 401.
    const response = await getServer()
      .post('/kobo/webhook')
      .set('Authorization', basicAuthHeader('wrong', 'wrong'))
      .send({
        _uuid: submissionUuid,
        _xform_id_string: assetUid,
      });

    // Assert
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
