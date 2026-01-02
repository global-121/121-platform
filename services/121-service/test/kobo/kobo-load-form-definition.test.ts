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
import { getKobo, postKobo } from '@121-service/test/helpers/kobo.helper';
import {
  getProgram,
  postProgram,
} from '@121-service/test/helpers/program.helper';
import { postProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const createProgramFspConfigurationSafaricomDto: CreateProgramFspConfigurationDto =
  {
    name: 'Safaricom fsp', // on purpose not using enum value here
    label: {
      en: 'Safaricom label English translation',
      nl: 'Safaricom label Dutch translation',
    },
    fspName: Fsps.safaricom,
    properties: [],
  };

const requiredProgramRegistrationAttributesForSafaricom = [
  {
    name: FspAttributes.nationalId,
    label: {
      en: 'original label will be overwritten',
    },
    type: RegistrationAttributeTypes.tel,
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

describe('Import kobo form definition', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.productionInitialState, __filename);
    accessToken = await getAccessToken();
  });

  it('successfully imports kobo form definition', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program that successfully integrates kobo',
      },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    await postProgramFspConfiguration({
      programId: createProgramResponse.body.id,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const programId = createProgramResponse.body.id;
    const getProgramResponseBeforeKoboIntegration = await getProgram(
      programId,
      accessToken,
    );
    const programBeforeKoboIntegration =
      getProgramResponseBeforeKoboIntegration.body;

    // Act
    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`, // our base path for the kobo part of the mock service
    };

    const linkKoboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    const programAttributesBeforeKobo =
      programBeforeKoboIntegration.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    const getKoboResponse = await getKobo({ programId, accessToken });

    const getProgramResponseAfterKoboIntegration = await getProgram(
      programId,
      accessToken,
    );
    const programAfterKoboIntegration =
      getProgramResponseAfterKoboIntegration.body;
    const programAttributesAfterKoboIntegration =
      programAfterKoboIntegration.programRegistrationAttributes.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    const programAttributeNamesAfterKobo =
      programAfterKoboIntegration.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    const expectedAttributeNamesBeforeKobo = [
      FspAttributes.nationalId,
      FspAttributes.fullName,
      FspAttributes.phoneNumber,
    ];

    const expectedAttributeNamesAfterKobo = [
      ...expectedAttributeNamesBeforeKobo,
      'How_are_you_today_select_one',
      'What_is_2_2_number',
    ];

    // Assert
    expect(programAttributesBeforeKobo.sort()).toEqual(
      expectedAttributeNamesBeforeKobo.sort(),
    );

    expect(linkKoboResponse.body).toMatchInlineSnapshot(`
     {
       "dryRun": false,
       "message": "Kobo form integrated successfully",
     }
    `);
    expect(linkKoboResponse.status).toBe(HttpStatus.CREATED);

    // Verify Kobo integration was created successfully
    expect(getKoboResponse.status).toBe(HttpStatus.OK);
    expect(getKoboResponse.body).toHaveProperty('assetId', koboLinkDto.assetId);
    expect(getKoboResponse.body).toHaveProperty('versionId');

    // Verify program registration attributes were updated based on Kobo form definition
    expect(programAttributeNamesAfterKobo.sort()).toEqual(
      expectedAttributeNamesAfterKobo.sort(),
    );

    // Test common properties that should be the same for all attributes
    programAttributesAfterKoboIntegration.forEach((attribute) => {
      expect(attribute.duplicateCheck).toBe(false);
      expect(attribute.includeInTransactionExport).toBe(false);
      expect(attribute.programId).toBe(programId);
      expect(attribute.scoring).toEqual({});
      expect(attribute.pattern).toBeNull();
      expect(attribute.placeholder).toBeNull();
      expect(attribute.editableInPortal).toBe(true);
    });

    // Test dynamic properties in snapshot (excluding auto-generated fields and common properties)
    const attributesForSnapshot = programAttributesAfterKoboIntegration.map(
      ({
        created: _created,
        updated: _updated,
        id: _id,
        programId: _programId,
        duplicateCheck: _duplicateCheck,
        includeInTransactionExport: _includeInTransactionExport,
        scoring: _scoring,
        pattern: _pattern,
        placeholder: _placeholder,
        editableInPortal: _editableInPortal,
        ...rest
      }) => rest,
    );
    expect(attributesForSnapshot).toMatchInlineSnapshot(`
     [
       {
         "isRequired": true,
         "label": {
           "en": "What is your name (text)?",
           "nl": "Hoe heet je?",
         },
         "name": "fullName",
         "options": null,
         "showInPeopleAffectedTable": true,
         "type": "text",
       },
       {
         "isRequired": false,
         "label": {
           "en": "How are you today (select one)?",
           "nl": "Hoe gaat het?",
         },
         "name": "How_are_you_today_select_one",
         "options": [
           {
             "label": {
               "en": "Great",
               "nl": "Geweldig",
             },
             "option": "great",
           },
           {
             "label": {
               "en": "Ok",
               "nl": "Ok",
             },
             "option": "ok",
           },
           {
             "label": {
               "en": "Terrible",
               "nl": "Gruwelijk",
             },
             "option": "terrible",
           },
         ],
         "showInPeopleAffectedTable": true,
         "type": "dropdown",
       },
       {
         "isRequired": false,
         "label": {
           "en": "National ID number",
         },
         "name": "nationalId",
         "options": [],
         "showInPeopleAffectedTable": true,
         "type": "text",
       },
       {
         "isRequired": false,
         "label": {
           "en": "Phone number",
         },
         "name": "phoneNumber",
         "options": null,
         "showInPeopleAffectedTable": true,
         "type": "text",
       },
       {
         "isRequired": true,
         "label": {
           "en": "What is 2+2 (number)?",
           "nl": "Wat is 2+2?",
         },
         "name": "What_is_2_2_number",
         "options": null,
         "showInPeopleAffectedTable": true,
         "type": "numeric",
       },
     ]
    `);
  });

  it('should add new languages from kobo form without removing existing program languages', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Test program with single language',
      },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.fr,
      ], // Only English and French initially
      fixedTransferValue: 10,
      programRegistrationAttributes:
        requiredProgramRegistrationAttributesForSafaricom,
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;
    await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });
    // Act - Link Kobo form that has English + Dutch languages
    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const koboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    const getProgramResponseAfter = await getProgram(programId, accessToken);
    const programAfter = getProgramResponseAfter.body;

    // Assert - Program should now have English, French and Dutch languages
    expect(koboResponse.status).toBe(HttpStatus.CREATED);
    expect(programAfter.languages).toContain(RegistrationPreferredLanguage.en);
    expect(programAfter.languages).toContain(RegistrationPreferredLanguage.nl);
    expect(programAfter.languages).toContain(RegistrationPreferredLanguage.fr);
    expect(programAfter.languages).toHaveLength(3);
  });

  it('should return multiple validation errors when linking kobo form', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Test program for validation errors',
      },
      languages: [RegistrationPreferredLanguage.en],
      fixedTransferValue: 10,
      programRegistrationAttributes:
        requiredProgramRegistrationAttributesForSafaricom,
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;

    // Add FSP configuration that requires specific attributes
    await postProgramFspConfiguration({
      programId,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    // Act - Try to link Kobo form that is missing required FSP attributes
    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'asset-id-body-that-triggers-errors', // This mock form is missing required FSP attributes
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const linkKoboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Assert - Should receive validation errors for missing FSP attributes
    expect(linkKoboResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(linkKoboResponse.body.message).toMatchInlineSnapshot(`
     "Kobo form definition validation failed:
     - Missing required FSP attribute 'phoneNumber' for FSP 'Safaricom fsp' in Kobo asset survey.
     - Missing required FSP attribute 'nationalId' for FSP 'Safaricom fsp' in Kobo asset survey.
     - Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: fullName
     - Kobo form must contain a question with name phoneNumber (should be a text type and country code should be included) or program.allowEmptyPhoneNumber must be set to true."
    `);
  });

  it('should not update program or create kobo entity when dryRun is true', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Kobo dryrun test program',
      },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    await postProgramFspConfiguration({
      programId: createProgramResponse.body.id,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const programId = createProgramResponse.body.id;
    const getProgramResponseBefore = await getProgram(programId, accessToken);
    const programAttributesBeforeDryRun =
      getProgramResponseBefore.body.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    // Act
    const linkKoboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: true,
    });

    // Assert
    expect(linkKoboResponse.status).toBe(HttpStatus.OK);
    expect(linkKoboResponse.body.message).toEqual(
      'Dry run successful - validation passed',
    );

    // Verify program registration attributes were NOT updated
    const getProgramResponseAfter = await getProgram(programId, accessToken);
    const programAttributesAfterDryRun =
      getProgramResponseAfter.body.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    expect(programAttributesAfterDryRun.sort()).toEqual(
      programAttributesBeforeDryRun.sort(),
    );

    // Verify kobo entity was NOT created
    const getKoboResponse = await getKobo({ programId, accessToken });
    expect(getKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should throw HttpException when program has no FSP configurations', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program without FSP',
      },
      languages: [RegistrationPreferredLanguage.en],
      programRegistrationAttributes: [],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;
    // Note: NOT adding any FSP configuration

    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    // Act
    const linkKoboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Assert
    expect(linkKoboResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(linkKoboResponse.body.message).toMatchInlineSnapshot(
      `"Program needs to have at least one FSP configured"`,
    );
  });

  it('should merge new kobo form definition with existing one', async () => {
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program for merging kobo definitions',
      },
      languages: [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    await postProgramFspConfiguration({
      programId: createProgramResponse.body.id,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const programId = createProgramResponse.body.id;

    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Act
    // import a second kobo definition that has some changes compared to the first one
    const koboLinkDtoSecondImport: CreateKoboDto = {
      ...koboLinkDto,
      assetId: 'asset-id-happy-flow-with-changes',
    };

    await postKobo({
      programId,
      body: koboLinkDtoSecondImport,
      accessToken,
      dryRun: false,
    });

    // Assert
    const updatedKobo = await getKobo({ programId, accessToken });
    const koboVersionIdAfterSecondImport = updatedKobo.body.versionId;
    expect(koboVersionIdAfterSecondImport).toBeDefined();
    expect(koboVersionIdAfterSecondImport).toEqual(
      'asset-id-happy-flow-with-changes', // version id from the second kobo definition
    );

    const getProgramResponseAfterUpdate = await getProgram(
      programId,
      accessToken,
    );
    const programAfterUpdate = getProgramResponseAfterUpdate.body;
    const programAttributesAfterUpdate =
      programAfterUpdate.programRegistrationAttributes;
    const programAttributeNamesAfterUpdate =
      programAfterUpdate.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    // test that the new attribute from the second kobo form is added
    expect(programAttributeNamesAfterUpdate).toContain('newAttribute');
    // Test that the updated attribute has the new label from the second kobo form
    const updatedAttribute = programAttributesAfterUpdate.find(
      (attr) => attr.name === 'fullName',
    );
    expect(updatedAttribute?.label).toEqual({
      en: 'new label',
      nl: 'new label',
      fr: 'new label',
    });

    // Test that How_are_you_today_select_one attribute still exists in the program even though it was removed in the second kobo form
    const removedInKoboAttribute = programAttributesAfterUpdate.find(
      (attr) => attr.name === 'How_are_you_today_select_one',
    );
    expect(removedInKoboAttribute).toBeDefined();
  });

  it('should handle not found error from kobo api', async () => {
    const assetId = 'asset-id-not-found';
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program for kobo not found test',
      },
      languages: [RegistrationPreferredLanguage.en],
    } as CreateProgramDto;

    const createProgramResponse = await postProgram(program, accessToken);
    const programId = createProgramResponse.body.id;

    await postProgramFspConfiguration({
      programId: createProgramResponse.body.id,
      body: createProgramFspConfigurationSafaricomDto,
      accessToken,
    });

    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetId,
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const linkKoboResponse = await postKobo({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    expect(linkKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(linkKoboResponse.body.message).toMatchInlineSnapshot(
      `"Kobo information not found for asset: asset-id-not-found. This form does not exist or is not (yet) deployed."`,
    );
  });
});
