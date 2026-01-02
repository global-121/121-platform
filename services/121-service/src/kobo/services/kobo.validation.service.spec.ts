import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

describe('KoboValidationService', () => {
  let service: KoboValidationService;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let programRepository: ProgramRepository;

  const baseSurveyItems = [
    {
      name: 'start',
      type: 'start',
      $kuid: '3pTXFjOFa',
      $xpath: 'start',
      $autoname: 'start',
    },
    {
      name: 'end',
      type: 'end',
      $kuid: 'gHDXZWdPn',
      $xpath: 'end',
      $autoname: 'end',
    },
  ];

  const baseFormDefinition = {
    name: 'Test Registration Form',
    languages: ['English (en)'],
    dateDeployed: new Date('2025-04-30T14:49:53.989148Z'),
    versionId: 'v6Y4ZtQE7MJAinjPeQCUqd',
  };

  const successFormDefinition: KoboFormDefinition = {
    ...baseFormDefinition,
    survey: [
      ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
      {
        name: FspAttributes.phoneNumber,
        type: 'text',
        label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
        required: true,
        choices: [],
      },
      {
        name: FspAttributes.fullName,
        type: 'text',
        label: ['What is your full name?', 'Wat is je volledige naam?'],
        required: true,
        choices: [],
      },
      {
        name: FspAttributes.whatsappPhoneNumber,
        type: 'text',
        label: ['WhatsApp phone number', 'WhatsApp telefoonnummer'],
        required: false,
        choices: [],
      },
      {
        name: FspAttributes.nationalId,
        type: 'text',
        label: ['National ID number', 'Nationale ID nummer'],
        required: false,
        choices: [],
      },
    ],
    languages: ['English (en)', 'Dutch (nl)'],
  };

  const mockFspConfigs = [
    {
      fspName: Fsps.safaricom,
      name: 'Safaricom Kenya',
    },
    {
      fspName: Fsps.intersolveVoucherWhatsapp,
      name: 'Intersolve WhatsApp',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboValidationService,
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: ProgramRepository,
          useValue: {
            findOneOrFail: jest.fn().mockResolvedValue({
              fullnameNamingConvention: [],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<KoboValidationService>(KoboValidationService);
    programFspConfigurationRepository =
      module.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
      );
    programRepository = module.get<ProgramRepository>(ProgramRepository);
  });

  describe('validate fsp attributes', () => {
    it('should pass validation when all required FSP attributes are present in form definition', async () => {
      // Arrange
      const programId = 1;

      // Mock repository to return FSP configs
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: successFormDefinition,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException with array of 2 errors when required FSP attributes are missing', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigsWithMissingAttributes = [
        {
          fspName: Fsps.commercialBankEthiopia,
          name: 'Commercial Bank Ethiopia',
        },
      ];

      // Form definition that is missing the required bankAccountNumber attribute
      const formDefinitionWithMissingAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
            required: true,
            choices: [],
          },
          // Missing bankAccountNumber that is required for Commercial Bank Ethiopia
        ],
      };

      // Mock repository to return FSP configs that will have missing attributes
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigsWithMissingAttributes,
      );

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithMissingAttributes,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Missing required FSP attribute 'bankAccountNumber' for FSP 'Commercial Bank Ethiopia' in Kobo asset survey.
         - Missing required FSP attribute 'fullName' for FSP 'Commercial Bank Ethiopia' in Kobo asset survey."
        `);
    });

    it('should throw HttpException when FSP attribute has incompatible type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigsForTypeValidation = [
        {
          fspName: Fsps.safaricom,
          name: 'Safaricom Kenya',
        },
      ];

      const formDefinitionWithWrongType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: FspAttributes.nationalId,
            type: 'integer', // Wrong type nationalId is text
            label: ['National ID number', 'Nationale ID nummer'],
            required: false,
            choices: [],
          },
          {
            name: FspAttributes.phoneNumber,
            type: 'text', // correct type
            label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
            required: true,
            choices: [],
          },
        ],
      };

      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigsForTypeValidation,
      );

      // Act
      let error: HttpException | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithWrongType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Kobo form attribute "nationalId" has incompatible type for 121 attribute: expected: "background-audio, xml-external, acknowledge, audio, barcode, calculate, date, dateTime, file, geopoint, geoshape, geotrace, hidden, image, rank, select_multiple_from_file, select_multiple, text, time, video", got "integer"  "
        `);
    });
  });

  describe('validate fullnameNamingConvention attributes', () => {
    it('should pass validation when attributes are present', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithAllFullNameAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            required: true,
            choices: [],
          },
          {
            name: 'lastName',
            type: 'text',
            label: ['Last name'],
            required: true,
            choices: [],
          },
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: ['firstName', 'lastName'],
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithAllFullNameAttributes,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when fullnameNamingConvention attributes are missing', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionMissingFullNameAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            required: true,
            choices: [],
          },
          // Missing lastName and middleName from fullnameNamingConvention
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: ['firstName', 'lastName', 'middleName'],
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionMissingFullNameAttributes,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: lastName, middleName"
        `);
    });
  });

  describe('phoneNumber validation', () => {
    it('should pass validation when phoneNumber is present with correct type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithValidPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithValidPhoneNumber,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when phoneNumber is missing and allowEmptyPhoneNumber is false', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionMissingPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          // Missing phoneNumber field
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionMissingPhoneNumber,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Kobo form must contain a question with name phoneNumber (should be a text type and country code should be included) or program.allowEmptyPhoneNumber must be set to true."
        `);
    });

    it('should pass validation when phoneNumber is missing but allowEmptyPhoneNumber is true', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionMissingPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          // Missing phoneNumber field
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionMissingPhoneNumber,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when phoneNumber has incompatible type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithWrongPhoneNumberType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: FspAttributes.phoneNumber,
            type: 'integer', // Wrong type - should be text
            label: ['Phone number'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithWrongPhoneNumberType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Kobo form attribute "phoneNumber" has incompatible type for 121 attribute: expected: "text", got "integer"  "
        `);
    });
  });

  describe('scope validation', () => {
    it('should pass validation when scope is disabled', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithoutScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          // No scope field present
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithoutScope,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should pass validation when scope is enabled and scope item exists with correct type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithValidScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: GenericRegistrationAttributes.scope,
            type: 'text',
            label: ['Scope'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: true,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithValidScope,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when scope is enabled but scope item is missing', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionMissingScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          // Missing scope field
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: true,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionMissingScope,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
         "Kobo form definition validation failed:
         - Kobo form must contain a scope item if program.enableScope is set to true."
        `);
    });

    it('should throw HttpException when scope has incompatible type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithWrongScopeType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: GenericRegistrationAttributes.scope,
            type: 'integer', // Wrong type - should be text
            label: ['Scope'],
            required: true,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: true,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithWrongScopeType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
       "Kobo form definition validation failed:
       - Kobo form attribute "scope" has incompatible type for 121 attribute: expected: "background-audio, xml-external, acknowledge, audio, barcode, calculate, date, dateTime, file, geopoint, geoshape, geotrace, hidden, image, rank, select_multiple_from_file, select_multiple, text, time, video", got "integer"  "
      `);
    });
  });

  describe('matrix type validation', () => {
    it('should throw HttpException when form contains matrix type', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithMatrixType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems.map((item) => ({ ...item, choices: [] })),
          {
            name: 'matrix_question',
            type: 'begin_kobomatrix',
            label: ['Matrix question group'],
            required: false,
            choices: [],
          },
        ],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithMatrixType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toMatchInlineSnapshot(`
       "Kobo form definition validation failed:
       - Kobo form must not contain a matrix item. Found: ["Matrix question group"]"
      `);
    });
  });

  describe('kobo language codes validation', () => {
    it('should pass validation when all languages have valid ISO codes', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithValidLanguages: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems.map((item) => ({ ...item, choices: [] }))],
        languages: ['English (en)', 'Dutch (nl)', 'French (fr)'],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithValidLanguages,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when language has invalid ISO code format', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithInvalidLanguage: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems.map((item) => ({ ...item, choices: [] }))],
        languages: ['English (en)', 'Invalid Language', 'Another Invalid'],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithInvalidLanguage,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toContain('Invalid Kobo language code');
      expect(error.message).toContain('Invalid Language');
      expect(error.message).toContain('Another Invalid');
      expect(error.message).toContain(
        'https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes',
      );
    });

    it('should throw HttpException when language code is not in our system', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithUnsupportedLanguage: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems.map((item) => ({ ...item, choices: [] }))],
        // 'xx' is a valid ISO 639 format but not in RegistrationPreferredLanguage enum
        languages: ['English (en)', 'Unknown (xx)'],
      };

      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithUnsupportedLanguage,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toContain('Invalid Kobo language code');
      expect(error.message).toContain('Unknown (xx)');
    });
  });
});
