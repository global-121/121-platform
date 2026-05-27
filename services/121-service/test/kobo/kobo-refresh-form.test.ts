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
import { KoboMockAssetUids } from '@121-service/test/fixtures/kobo-mock-asset-uids';
import {
    getKoboFromProgram,
    refreshKoboForm,
    setupProgramWithKoboIntegration,
    upsertKoboToProgram,
} from '@121-service/test/helpers/kobo.helper';
import {
    getProgram,
    postProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
    getAccessToken,
    getAccessTokenCvaManager,
    resetDB,
} from '@121-service/test/helpers/utility.helper';

const createProgramFspConfigurationSafaricomDto: CreateProgramFspConfigurationDto =
  {
    name: 'SafaricomFsp',
    label: {
      en: 'Safaricom label',
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

describe('Refresh Kobo form', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.productionInitialState });
    accessToken = await getAccessToken();
  });

  it('should return 404 when no Kobo integration exists for the program', async () => {
    // Arrange
    const createProgramResponse = await postProgram(
      {
        ...baseProgram,
        titlePortal: { en: 'Program without Kobo integration' },
        languages: [RegistrationPreferredLanguage.en],
      } as CreateProgramDto,
      accessToken,
    );
    await postProgramFspConfiguration({
      programId: createProgramResponse.body.id,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    // Act
    const response = await refreshKoboForm({
      programId: createProgramResponse.body.id,
      accessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 200 with form name when Kobo integration exists', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program for Kobo refresh' },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const { programId } = await setupProgramWithKoboIntegration({
      assetUid: KoboMockAssetUids.happyFlow,
      program,
      fspConfiguration: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    // Act
    const response = await refreshKoboForm({ programId, accessToken });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      message: 'Kobo form refreshed successfully',
      name: '25042025 Prototype Sprint',
    });
  });

  it('should allow a CVA manager to refresh the Kobo form', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program for CVA manager Kobo refresh' },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const { programId } = await setupProgramWithKoboIntegration({
      assetUid: KoboMockAssetUids.happyFlow,
      program,
      fspConfiguration: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const cvaManagerAccessToken = await getAccessTokenCvaManager();

    // Act
    const response = await refreshKoboForm({
      programId,
      accessToken: cvaManagerAccessToken,
    });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);
  });

  it('should update program attributes and languages when refreshed with an updated Kobo form', async () => {
    // Arrange – integrate the base form first
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: { en: 'Program for Kobo form attribute update on refresh' },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const { programId } = await setupProgramWithKoboIntegration({
      assetUid: KoboMockAssetUids.happyFlow,
      program,
      fspConfiguration: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    // Re-integrate with the updated form (which adds a new attribute and French language)
    // This also updates the stored assetUid so the next refresh will fetch the updated form
    await upsertKoboToProgram({
      programId,
      body: {
        token: 'mock-token',
        assetUid: KoboMockAssetUids.happyFlowWithChanges,
        url: `${env.MOCK_SERVICE_URL}/api/kobo`,
      } as CreateKoboDto,
      accessToken,
      dryRun: false,
    });

    // Verify the versionId and kobo entity match the updated form
    const koboBefore = (await getKoboFromProgram({ programId, accessToken }))
      .body;
    expect(koboBefore.versionId).toBe(KoboMockAssetUids.happyFlowWithChanges);

    // Act – call refresh: it should re-fetch the updated form and apply it again
    const response = await refreshKoboForm({ programId, accessToken });

    // Assert
    expect(response.status).toBe(HttpStatus.OK);

    const programAfter = (await getProgram(programId, accessToken)).body;
    const attributeNamesAfter = programAfter.programRegistrationAttributes.map(
      (attr: { name: string }) => attr.name,
    );
    expect(attributeNamesAfter).toContain('newAttribute');
    expect(programAfter.languages).toContain(RegistrationPreferredLanguage.fr);
  });
});

