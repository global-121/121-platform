/* eslint-disable jest/no-conditional-expect */

import { HttpStatus } from '@nestjs/common';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  getKoboIntegration,
  getProgram,
  linkKoboForm,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFinancialServiceProviderConfiguration } from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Create program which should be edited via kobo later', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.productionInitialState);
    accessToken = await getAccessToken();
  });

  it('should go through program creation flow', async () => {
    // Arrange
    const program = {
      titlePortal: {
        en: 'Kobo land program',
      },
      currency: 'MWK',
      languages: [LanguageEnum.en, LanguageEnum.nl],
      fixedTransferValue: 20,
    };

    // Act
    const createProgramResponse = await postProgram(program, accessToken);
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);
    console.log('🚀 ~ it ~ createProgramResponse:', createProgramResponse.body);

    // Assert
    const programId = createProgramResponse.body.id;
    const getProgramResponse = await getProgram(programId, accessToken);
    console.log('🚀 ~ it ~ getProgramResponse:', getProgramResponse.body);
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

    // Check for presence of the automatically created attributes
    const { programRegistrationAttributes } = getProgramResponse.body;
    expect(programRegistrationAttributes).toBeDefined();
    expect(Array.isArray(programRegistrationAttributes)).toBe(true);

    // Check for phoneNumber attribute
    const phoneNumberAttribute = programRegistrationAttributes.find(
      (attr) => attr.name === 'phoneNumber',
    );
    expect(phoneNumberAttribute).toBeDefined();
    expect(phoneNumberAttribute.type).toBe('text');

    // Check for fullName attribute
    const fullNameAttribute = programRegistrationAttributes.find(
      (attr) => attr.name === 'fullName',
    );
    expect(fullNameAttribute).toBeDefined();
    expect(fullNameAttribute.type).toBe('text');
    expect(fullNameAttribute.isRequired).toBe(true);

    const createProgramFspConfigurationDto: CreateProgramFinancialServiceProviderConfigurationDto =
      {
        name: 'Safaricom',
        label: {
          en: 'Safaricom label English translation',
          nl: 'Safaricom label Dutch translation',
        },
        isDefault: true,
        financialServiceProviderName: FinancialServiceProviders.safaricom,
        properties: [],
      };

    const postFspConfigResponse =
      await postProgramFinancialServiceProviderConfiguration({
        programId,
        body: createProgramFspConfigurationDto,
        accessToken,
      });

    console.log('🚀 ~ it ~ postFspConfigResponse:', postFspConfigResponse.body);

    // Ensure that missing fsp attributes are added to the program
    const fsp = getFinancialServiceProviderSettingByNameOrThrow(
      createProgramFspConfigurationDto.financialServiceProviderName,
    );
    const fspAttributes = fsp.attributes.map((attribute) => attribute.name);
    const programWithFsp = await getProgram(programId, accessToken);
    const currentProgramAttributeNames =
      programWithFsp.body.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );
    expect(currentProgramAttributeNames).toEqual(
      expect.arrayContaining(fspAttributes),
    );

    // Test Kobo integration
    // Link Kobo form to program
    const koboLinkDto = {
      koboToken: process.env.KOBO_TOKEN,
      koboAssetId: process.env.KOBO_ASSET_ID,
      koboUrl: process.env.KOBO_URL,
    };
    console.log('🚀 ~ it ~ koboLinkDto:', koboLinkDto);

    const linkKoboResponse = await linkKoboForm(
      programId,
      koboLinkDto,
      accessToken,
    );
    console.log('🚀 ~ it ~ linkKoboResponse:', linkKoboResponse.body);

    expect(linkKoboResponse.status).toBe(HttpStatus.OK);

    // Verify Kobo integration was created successfully
    const getKoboResponse = await getKoboIntegration(programId, accessToken);

    expect(getKoboResponse.status).toBe(HttpStatus.OK);
    expect(getKoboResponse.body).toHaveProperty(
      'assetId',
      koboLinkDto.koboAssetId,
    );
    expect(getKoboResponse.body).toHaveProperty(
      'tokenCode',
      koboLinkDto.koboToken,
    );
    expect(getKoboResponse.body).toHaveProperty('programId', programId);
    expect(getKoboResponse.body).toHaveProperty('versionId');
    expect(getKoboResponse.body).toHaveProperty('id');
  });
});
