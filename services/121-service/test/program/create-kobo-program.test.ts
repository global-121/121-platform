/* eslint-disable jest/no-conditional-expect */

import { HttpStatus } from '@nestjs/common';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { CreateProgramFinancialServiceProviderConfigurationDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/create-program-financial-service-provider-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  deleteKoboWebhook,
  getExistingKoboWebhooks,
  getKoboIntegration,
  getProgram,
  importKoboSubmissions,
  linkKoboForm,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFinancialServiceProviderConfiguration } from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const createProgramFspConfigurationSafaricomDto: CreateProgramFinancialServiceProviderConfigurationDto =
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

const createProgramFspConfigurationVisaDto: CreateProgramFinancialServiceProviderConfigurationDto =
  {
    name: 'Visa',
    label: {
      en: 'Visa label English translation',
      nl: 'Visa label Dutch translation',
    },
    isDefault: false,
    financialServiceProviderName: FinancialServiceProviders.intersolveVisa,
    properties: [
      {
        name: FinancialServiceProviderConfigurationProperties.brandCode,
        value: 'INTERSOLVE_VISA_BRAND_CODE',
      },
      {
        name: FinancialServiceProviderConfigurationProperties.coverLetterCode,
        value: 'INTERSOLVE_VISA_COVERLETTER_CODE',
      },
      {
        name: FinancialServiceProviderConfigurationProperties.fundingTokenCode,
        value: 'INTERSOLVE_VISA_FUNDINGTOKEN_CODE',
      },
    ],
  };

describe('Create program which should be edited via kobo later', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.productionInitialState);
    accessToken = await getAccessToken();
  });

  it('should go through program creation flow', async () => {
    // Arrange

    // Delete existing hooks from kobo for convience in this prototype

    const hooksReponse = await getExistingKoboWebhooks({
      assetId: process.env.KOBO_ASSET_ID!,
      token: process.env.KOBO_TOKEN!,
      baseUrl: process.env.KOBO_URL!,
    });

    const hooks = hooksReponse.body.results;
    console.log('🚀 ~ it.only ~ hooks:', hooks);

    for (const hook of hooks) {
      const deleteResult = await deleteKoboWebhook({
        assetId: process.env.KOBO_ASSET_ID!,
        hookId: hook.uid,
        token: process.env.KOBO_TOKEN!,
        baseUrl: process.env.KOBO_URL!,
      });
      expect(deleteResult.status).toBe(HttpStatus.NO_CONTENT);
    }

    const program = {
      titlePortal: {
        en: 'Kobo land program',
      },
      currency: 'MWK',
      languages: [LanguageEnum.en, LanguageEnum.nl],
      fixedTransferValue: 20,
      enableMaxPayments: true,
      defaultMaxPayments: 5,
    };

    // Act
    const createProgramResponse = await postProgram(program, accessToken);
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    const programId = createProgramResponse.body.id;
    const getProgramResponse = await getProgram(programId, accessToken);
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

    const postFspConfigResponse =
      await postProgramFinancialServiceProviderConfiguration({
        programId,
        body: createProgramFspConfigurationSafaricomDto,
        accessToken,
      });

    console.log('🚀 ~ it ~ postFspConfigResponse:', postFspConfigResponse.body);

    // Ensure that missing fsp attributes are added to the program
    const fsp = getFinancialServiceProviderSettingByNameOrThrow(
      createProgramFspConfigurationSafaricomDto.financialServiceProviderName,
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
    const linkKoboResponseDryRun = await linkKoboForm({
      programId,
      linkKoboDto: koboLinkDto,
      accessToken,
      dryRun: true,
    });
    console.log('🚀 ~ it ~ linkKoboResponse:', linkKoboResponseDryRun.body);

    expect(linkKoboResponseDryRun.body).toHaveProperty('name');
    expect(linkKoboResponseDryRun.status).toBe(HttpStatus.CREATED);

    const linkKoboResponse = await linkKoboForm({
      programId,
      linkKoboDto: koboLinkDto,
      accessToken,
      dryRun: false,
    });
    console.log('🚀 ~ it ~ linkKoboResponse:', linkKoboResponse.body);

    expect(linkKoboResponseDryRun.body).toHaveProperty('name');
    expect(linkKoboResponse.status).toBe(HttpStatus.CREATED);

    // Verify Kobo integration was created successfully
    const getKoboResponse = await getKoboIntegration(programId, accessToken);

    expect(getKoboResponse.status).toBe(HttpStatus.OK);
    expect(getKoboResponse.body).toHaveProperty(
      'assetId',
      koboLinkDto.koboAssetId,
    );

    expect(getKoboResponse.body).toHaveProperty('versionId');

    const importResponse = await importKoboSubmissions(programId, accessToken);
    expect(importResponse.body).toStrictEqual({
      message: 'Submissions imported successfully',
      success: true,
    });
    expect(importResponse.status).toBe(HttpStatus.OK);

    const getRegistrationReponse = await getRegistrations({
      programId,
      accessToken,
    });

    const registrations = getRegistrationReponse.body.data;
    expect(registrations.length).toBeGreaterThan(0);

    // each registration should have programFinancialServiceProviderConfigurationName as Safaricom
    registrations.forEach((registration) => {
      expect(
        registration.programFinancialServiceProviderConfigurationName,
      ).toBe('Safaricom');
    });
  });

  it('should not allow linking of kobo form when expected survey items are missing', async () => {
    // Arrange
    const program = {
      titlePortal: {
        en: 'Kobo land program with missing attributes',
      },
      currency: 'MWK',
      languages: [LanguageEnum.en, LanguageEnum.nl],
      fixedTransferValue: 20,
    };

    // Act
    const createProgramResponse = await postProgram(program, accessToken);
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    const programId = createProgramResponse.body.id;

    await postProgramFinancialServiceProviderConfiguration({
      programId,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    await postProgramFinancialServiceProviderConfiguration({
      programId,
      body: createProgramFspConfigurationVisaDto,
      accessToken,
    });

    // Link Kobo form to program
    const koboLinkDto = {
      koboToken: process.env.KOBO_TOKEN,
      koboAssetId: process.env.KOBO_ASSET_ID_MISSING_ATTRIBUTES,
      koboUrl: process.env.KOBO_URL,
    };
    console.log('🚀 ~ it ~ koboLinkDto:', koboLinkDto);

    const linkKoboResponse = await linkKoboForm({
      programId,
      linkKoboDto: koboLinkDto,
      accessToken,
      dryRun: false,
    });
    console.log('🚀 ~ it.only ~ linkKoboResponse:', linkKoboResponse.body);

    expect(linkKoboResponse.body).toMatchSnapshot();

    expect(linkKoboResponse.status).toBe(HttpStatus.BAD_REQUEST);

    // Verify Kobo integration was created successfully
    const getKoboResponse = await getKoboIntegration(programId, accessToken);

    expect(getKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should not allow the link of a kobo form when the form is not deployed', async () => {
    // Arrange
    const program = {
      titlePortal: {
        en: 'Kobo land program with missing form',
      },
      currency: 'MWK',
      languages: [LanguageEnum.en, LanguageEnum.nl],
      fixedTransferValue: 20,
      scopeEnabled: true,
    };

    // Act
    const createProgramResponse = await postProgram(program, accessToken);
    expect(createProgramResponse.statusCode).toBe(HttpStatus.CREATED);

    // Assert
    const programId = createProgramResponse.body.id;

    // Link Kobo form to program
    const koboLinkDto = {
      koboToken: process.env.KOBO_TOKEN,
      koboAssetId: 'FAKE-ASSET-ID',
      koboUrl: process.env.KOBO_URL,
    };

    const linkKoboResponse = await linkKoboForm({
      programId,
      linkKoboDto: koboLinkDto,
      accessToken,
      dryRun: false,
    });
    console.log('🚀 ~ it.only ~ linkKoboResponse:', linkKoboResponse.body);

    expect(linkKoboResponse.status).toBe(HttpStatus.NOT_FOUND);

    // Verify Kobo integration was not created
    const getKoboResponse = await getKoboIntegration(programId, accessToken);

    expect(getKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should ceate an extra registration attribute when one is missing', async () => {
    const program = {
      titlePortal: {
        en: 'Kobo land program',
      },
      currency: 'MWK',
      languages: [LanguageEnum.en, LanguageEnum.nl],
      fixedTransferValue: 20,
      enableMaxPayments: true,
      defaultMaxPayments: 5,
    };

    // Act
    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;
    await postProgramFinancialServiceProviderConfiguration({
      programId,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });
    const extraProperyName = 'extraProperty';
    console.log('🚀 ~ it.only ~ extraProperyName:', extraProperyName);
    const registration = {
      phoneNumber: '1234567890',
      nationalId: '2345678',
      fullName: 'John Doedoe',
      [extraProperyName]: 'extraValue',
    };

    const result = await importRegistrations(
      programId,
      [registration],
      accessToken,
    );
    console.log(result.body);
    expect(result.status).toBe(HttpStatus.CREATED);

    const programResponse = await getProgram(programId, accessToken);
    const { programRegistrationAttributes } = programResponse.body;
    console.log(
      '🚀 ~ it.only ~ programRegistrationAttributes:',
      programRegistrationAttributes,
    );

    const propExtra = programRegistrationAttributes.find(
      (attr) => attr.name === extraProperyName,
    );
    expect(propExtra).toBeDefined();
    expect(propExtra.type).toBe('text');
    expect(propExtra.isRequired).toBe(false);
  });
});
