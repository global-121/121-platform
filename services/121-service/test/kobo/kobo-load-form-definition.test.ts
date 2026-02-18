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
import {
  getKoboFromProgram,
  postKoboToProgram,
} from '@121-service/test/helpers/kobo.helper';
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

describe('Import a Kobo form definition', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.productionInitialState, __filename);
    accessToken = await getAccessToken();
  });

  it('successfully imports a Kobo form definition', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program that successfully integrates with KoboToolbox',
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
    // Act
    const koboLinkDto: CreateKoboDto = {
      token: 'mock-token',
      assetUid: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const linkKoboResponse = await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Assert
    const getKoboResponse = await getKoboFromProgram({
      programId,
      accessToken,
    });

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

    expect(linkKoboResponse.body).toMatchInlineSnapshot(`
     {
       "message": "Kobo form integrated successfully",
       "name": "25042025 Prototype Sprint",
     }
    `);
    expect(linkKoboResponse.status).toBe(HttpStatus.CREATED);

    // Verify Kobo integration was created successfully
    const { status, body } = getKoboResponse;
    expect(status).toBe(HttpStatus.OK);
    expect(body).toHaveProperty('assetUid', koboLinkDto.assetUid);
    expect(body).toHaveProperty('versionId');

    // Verify program registration attributes were updated based on Kobo form definition
    expect(programAttributeNamesAfterKobo).toIncludeSameMembers(
      expectedAttributeNamesAfterKobo,
    );

    // Only test the first attribute in detail to test if the whole flow from Kobo form definition to program attribute worked
    // The mapping of the other attributes is tested in more detail in unit tests for the Kobo service
    const firstAttribute = programAttributesAfterKoboIntegration[0];
    const {
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
      ...firstAttributeSnapshot
    } = firstAttribute;

    expect(firstAttributeSnapshot).toMatchInlineSnapshot(`
     {
       "isRequired": true,
       "label": {
         "en": "What is your name (text)?",
         "nl": "Hoe heet je?",
       },
       "name": "fullName",
       "options": [],
       "showInPeopleAffectedTable": true,
       "type": "text",
     }
    `);
  });

  it('should return multiple validation errors when linking an invalid Kobo form', async () => {
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
      assetUid: 'asset-id-body-that-triggers-errors', // This mock form is missing required FSP attributes
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const linkKoboResponse = await postKoboToProgram({
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
     - Kobo form must contain a question with name phoneNumber (should be a text type and country code should be included) or program.allowEmptyPhoneNumber must be set to true.
     - Invalid Kobo language code: null. Please use https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes"
     `);
  });

  it('should not update program or create Kobo entity when dryRun is true', async () => {
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
      assetUid: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    // Act
    const linkKoboResponse = await postKoboToProgram({
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

    expect(programAttributesAfterDryRun).toIncludeSameMembers(
      programAttributesBeforeDryRun,
    );

    // Verify Kobo entity was NOT created
    const getKoboResponse = await getKoboFromProgram({
      programId,
      accessToken,
    });
    expect(getKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should merge new Kobo form definition with existing one', async () => {
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program for merging Kobo definitions',
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
      assetUid: 'success-asset',
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Act
    // import a second Kobo definition that has some changes compared to the first one
    const koboLinkDtoSecondImport: CreateKoboDto = {
      ...koboLinkDto,
      assetUid: 'asset-id-happy-flow-with-changes',
    };

    await postKoboToProgram({
      programId,
      body: koboLinkDtoSecondImport,
      accessToken,
      dryRun: false,
    });

    // Assert
    const updatedKobo = await getKoboFromProgram({ programId, accessToken });
    const koboVersionIdAfterSecondImport = updatedKobo.body.versionId;
    expect(koboVersionIdAfterSecondImport).toEqual(
      koboLinkDtoSecondImport.assetUid,
    );

    const programAfterUpdate = (await getProgram(programId, accessToken)).body;
    const programAttributesAfterUpdate =
      programAfterUpdate.programRegistrationAttributes;
    const programAttributeNamesAfterUpdate =
      programAfterUpdate.programRegistrationAttributes.map(
        (attribute) => attribute.name,
      );

    // test that the new attribute from the second Kobo form is added
    expect(programAttributeNamesAfterUpdate).toContain('newAttribute');
    // Test that the updated attribute has the new label from the second Kobo form
    const updatedAttribute = programAttributesAfterUpdate.find(
      (attr) => attr.name === 'fullName',
    );
    expect(updatedAttribute?.label).toEqual({
      en: 'new label',
      nl: 'new label',
      fr: 'new label',
    });

    // Test that How_are_you_today_select_one attribute still exists in the program even though it was removed in the second Kobo form
    const removedInKoboAttribute = programAttributesAfterUpdate.find(
      (attr) => attr.name === 'How_are_you_today_select_one',
    );
    expect(removedInKoboAttribute).toBeDefined();
  });

  it('should handle not found error from Kobo API', async () => {
    const assetUid = 'asset-id-not-found';
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program for Kobo not found test',
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
      assetUid,
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    const linkKoboResponse = await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    expect(linkKoboResponse.status).toBe(HttpStatus.NOT_FOUND);
    expect(linkKoboResponse.body.message).toMatch(
      /Kobo information not found\. This form does not exist or is not \(yet\) deployed for asset: asset-id-not-found, url: .+\/api\/v2\/assets\/asset-id-not-found\/deployment\./,
    );
  });

  it('should reject kobo form that already has a webhook configured', async () => {
    // Arrange
    const program: CreateProgramDto = {
      ...baseProgram,
      titlePortal: {
        en: 'Program for kobo webhook validation test',
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
      assetUid: 'asset-id-with-existing-webhook', // This mock form has a webhook configured
      url: `${env.MOCK_SERVICE_URL}/api/kobo`,
    };

    // Act
    const linkKoboResponse = await postKoboToProgram({
      programId,
      body: koboLinkDto,
      accessToken,
      dryRun: false,
    });

    // Assert
    expect(linkKoboResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(linkKoboResponse.body.message).toMatchInlineSnapshot(
      `"This Kobo form already has 1 webhook(s) configured: https://external-system.example.com/webhook. Please remove existing webhooks before integrating with 121 Platform."`,
    );
  });
});
