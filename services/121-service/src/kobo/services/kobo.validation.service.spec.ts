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

  const startAndEndSurveyItems = [
    {
      name: 'start',
      type: 'start',
      $kuid: '3pTXFjOFa',
      $xpath: 'start',
      $autoname: 'start',
      choices: [],
    },
    {
      name: 'end',
      type: 'end',
      $kuid: 'gHDXZWdPn',
      $xpath: 'end',
      $autoname: 'end',
      choices: [],
    },
  ];

  const baseSurveyItems = [
    ...startAndEndSurveyItems,
    {
      name: 'fsp',
      type: 'hidden',
      label: ['Financial Service Provider', 'Financiële dienstverlener'],
      choices: [],
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
      ...baseSurveyItems.map((item) => ({
        ...item,
      })),
      {
        name: FspAttributes.phoneNumber,
        type: 'text',
        label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
        choices: [],
      },
      {
        name: FspAttributes.fullName,
        type: 'text',
        label: ['What is your full name?', 'Wat is je volledige naam?'],
        choices: [],
      },
      {
        name: FspAttributes.whatsappPhoneNumber,
        type: 'text',
        label: ['WhatsApp phone number', 'WhatsApp telefoonnummer'],
        choices: [],
      },
      {
        name: FspAttributes.nationalId,
        type: 'text',
        label: ['National ID number', 'Nationale ID nummer'],
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

  const programId = 1;

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
          ...baseSurveyItems,
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
       [
         {
           "attributeName": "bankAccountNumber",
           "error": "Attribute 'bankAccountNumber' is missing",
           "solution": "Add 'bankAccountNumber' to the Kobo form",
           "type": "missingField",
         },
         {
           "attributeName": "fullName",
           "error": "Attribute 'fullName' is missing",
           "solution": "Add 'fullName' to the Kobo form",
           "type": "missingField",
         },
       ]
      `);
    });

    it('should throw HttpException when FSP attribute has incompatible type', async () => {
      // Arrange
      const mockFspConfigsForTypeValidation = [
        {
          fspName: Fsps.safaricom,
          name: 'Safaricom Kenya',
        },
      ];

      const formDefinitionWithWrongType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: FspAttributes.nationalId,
            type: 'integer', // Wrong type nationalId is text
            label: ['National ID number', 'Nationale ID nummer'],
            choices: [],
          },
          {
            name: FspAttributes.phoneNumber,
            type: 'text', // correct type
            label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
       [
         {
           "attributeName": "nationalId",
           "error": "Field type must not be 'integer'",
           "info": "Expected one of: 'background-audio', 'xml-external', 'acknowledge', 'audio', 'barcode', 'calculate', 'date', 'dateTime', 'file', 'geopoint', 'geoshape', 'geotrace', 'hidden', 'image', 'rank', 'select_multiple_from_file', 'select_multiple', 'text', 'time', 'video'",
           "solution": "Change the field type to an accepted type",
           "type": "typeMismatch",
         },
       ]
      `);
    });
  });

  describe('validate fullnameNamingConvention attributes', () => {
    it('should pass validation when attributes are present', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithAllFullNameAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            choices: [],
          },
          {
            name: 'lastName',
            type: 'text',
            label: ['Last name'],
            choices: [],
          },
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
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
      const mockFspConfigs = [];

      const formDefinitionMissingFullNameAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            choices: [],
          },
          // Missing lastName and middleName from fullnameNamingConvention
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);

      expect(error.response.errors).toMatchInlineSnapshot(`
       [
         {
           "attributeName": "lastName",
           "error": "Attribute 'lastName' is missing",
           "solution": "Add the missing attribute to the Kobo form",
           "type": "missingFullnameAttributes",
         },
         {
           "attributeName": "middleName",
           "error": "Attribute 'middleName' is missing",
           "solution": "Add the missing attribute to the Kobo form",
           "type": "missingFullnameAttributes",
         },
       ]
      `);
    });
  });

  describe('phoneNumber validation', () => {
    it('should pass validation when phoneNumber is present with correct type', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithValidPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
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
      const mockFspConfigs = [];

      const formDefinitionMissingPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
       [
         {
           "attributeName": "phoneNumber",
           "error": "Attribute 'phoneNumber' is missing",
           "solution": "Add a phoneNumber field with text type including country code, or set program.allowEmptyPhoneNumber to true",
           "type": "missingField",
         },
       ]
      `);
    });

    it('should pass validation when phoneNumber is missing but allowEmptyPhoneNumber is true', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionMissingPhoneNumber: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
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
      const mockFspConfigs = [];

      const formDefinitionWithWrongPhoneNumberType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: FspAttributes.phoneNumber,
            type: 'integer', // Wrong type - should be text
            label: ['Phone number'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "phoneNumber",
             "error": "Field type must not be 'integer'",
             "info": "Expected one of: 'text'",
             "solution": "Change the field type to an accepted type",
             "type": "typeMismatch",
           },
         ]
        `);
    });
  });

  describe('scope validation', () => {
    it('should pass validation when scope is disabled', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithoutScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
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
      const mockFspConfigs = [];

      const formDefinitionWithValidScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: GenericRegistrationAttributes.scope,
            type: 'text',
            label: ['Scope'],
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
      const mockFspConfigs = [];

      const formDefinitionMissingScope: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "scope",
             "error": "Attribute 'scope' is missing",
             "solution": "Add a scope field to the Kobo form (required when program.enableScope is true)",
             "type": "missingField",
           },
         ]
        `);
    });

    it('should throw HttpException when scope has incompatible type', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithWrongScopeType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: GenericRegistrationAttributes.scope,
            type: 'integer', // Wrong type - should be text
            label: ['Scope'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "scope",
             "error": "Field type must not be 'integer'",
             "info": "Expected one of: 'background-audio', 'xml-external', 'acknowledge', 'audio', 'barcode', 'calculate', 'date', 'dateTime', 'file', 'geopoint', 'geoshape', 'geotrace', 'hidden', 'image', 'rank', 'select_multiple_from_file', 'select_multiple', 'text', 'time', 'video'",
             "solution": "Change the field type to an accepted type",
             "type": "typeMismatch",
           },
         ]
        `);
    });
  });

  describe('matrix type validation', () => {
    it('should throw HttpException when form contains matrix type', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithMatrixType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'matrix_question',
            type: 'begin_kobomatrix',
            label: ['Matrix question group'],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "matrix_question",
             "error": "Form contains a matrix question, which isn't supported",
             "solution": "Remove the matrix item from the Kobo form",
             "type": "matrixTypeFound",
           },
         ]
        `);
    });
  });

  describe('kobo language codes validation', () => {
    it('should pass validation when all languages have valid ISO codes', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithValidLanguages: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems],
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
      const mockFspConfigs = [];

      const formDefinitionWithInvalidLanguage: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "Invalid Language",
             "error": "Invalid language code: 'Invalid Language'",
             "info": "See https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes for valid codes",
             "solution": "use a valid ISO 639 language code.",
             "type": "invalidLanguageCode",
           },
           {
             "attributeName": "Another Invalid",
             "error": "Invalid language code: 'Another Invalid'",
             "info": "See https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes for valid codes",
             "solution": "use a valid ISO 639 language code.",
             "type": "invalidLanguageCode",
           },
         ]
        `);
    });

    it('should throw HttpException when language code is not in our system', async () => {
      // Arrange
      const mockFspConfigs = [];

      const formDefinitionWithUnsupportedLanguage: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...baseSurveyItems],
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
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
         [
           {
             "attributeName": "Unknown (xx)",
             "error": "Invalid language code: 'Unknown (xx)'",
             "info": "See https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes for valid codes",
             "solution": "use a valid ISO 639 language code.",
             "type": "invalidLanguageCode",
           },
         ]
        `);
    });
  });

  describe('constrained attribute types validation', () => {
    const mockFspConfigs = [];

    beforeEach(() => {
      (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
        fullnameNamingConvention: [],
        allowEmptyPhoneNumber: true,
        enableScope: false,
      });
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );
    });

    it('should pass validation when constrained attribute has correct type', async () => {
      // Arrange
      const formDefinitionWithCorrectConstrainedType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'preferredLanguage', // Constrained attribute
            type: 'text', // Correct type - should be text
            label: ['Preferred Language'],
            choices: [],
          },
        ],
      };

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithCorrectConstrainedType,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when constrained attribute has incorrect type', async () => {
      // Arrange
      const formDefinitionWithIncorrectConstrainedType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'preferredLanguage', // Constrained attribute
            type: 'integer', // Wrong type - should be text
            label: ['Preferred Language'],
            choices: [],
          },
        ],
      };

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithIncorrectConstrainedType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
       [
         {
           "attributeName": "preferredLanguage",
           "error": "Field type must not be 'integer'",
           "info": "Expected one of: 'background-audio', 'xml-external', 'acknowledge', 'audio', 'barcode', 'calculate', 'date', 'dateTime', 'file', 'geopoint', 'geoshape', 'geotrace', 'hidden', 'image', 'rank', 'select_multiple_from_file', 'select_multiple', 'text', 'time', 'video'",
           "solution": "Change the field type to an accepted type",
           "type": "typeMismatch",
         },
       ]
      `);
    });

    it.each(['hidden', 'calculate'])(
      'should allow %s type for any attribute regardless of expected type',
      async (bypassType) => {
        // Arrange
        const formDefinition: KoboFormDefinition = {
          ...baseFormDefinition,
          survey: [
            ...baseSurveyItems,
            {
              name: 'preferredLanguage', // Expects text type, but hidden/calculate are also allowed
              type: bypassType,
              label: ['Preferred Language'],
              choices: [],
            },
          ],
        };

        // Act & Assert
        await expect(
          service.validateKoboFormDefinition({
            formDefinition,
            programId,
          }),
        ).resolves.not.toThrow();
      },
    );

    it('should throw HttpException when kobo survey uses a forbidden registration view attribute', async () => {
      // Arrange
      const formDefinitionWithForbiddenAttribute: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'paymentCount', // Auto-generated registration view attribute, not in KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES
            type: 'integer',
            label: ['Payment Count'],
            choices: [],
          },
        ],
      };

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithForbiddenAttribute,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
        [
          {
            "attributeName": "paymentCount",
            "error": "'paymentCount' is a reserved attribute name and cannot be filled from Kobo",
            "solution": "Rename the field 'paymentCount' to a non-reserved name",
            "type": "forbiddenAttribute",
          },
        ]
       `);
    });
  });

  describe('fsp question validation', () => {
    const commonFspAttributeFields = [
      {
        name: FspAttributes.phoneNumber,
        type: 'text',
        label: ['What is your phone number?'],
        choices: [],
      },
      {
        name: FspAttributes.fullName,
        type: 'text',
        label: ['What is your full name?'],
        choices: [],
      },
      {
        name: FspAttributes.whatsappPhoneNumber,
        type: 'text',
        label: ['WhatsApp phone number'],
        choices: [],
      },
      {
        name: FspAttributes.nationalId,
        type: 'text',
        label: ['National ID number'],
        choices: [],
      },
    ];

    beforeEach(() => {
      (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue(
        mockFspConfigs,
      );
    });

    it('should throw HttpException when fsp question is missing', async () => {
      // Arrange
      const formDefinitionWithoutFsp: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [...startAndEndSurveyItems, ...commonFspAttributeFields],
      };

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithoutFsp,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
        [
          {
            "attributeName": "fsp",
            "error": "Field is missing from your form",
            "solution": "Add a field named 'fsp' to the Kobo form",
            "type": "missingField",
          },
        ]
      `);
    });

    it('should pass validation when fsp is select_one and choices match FSP configurations', async () => {
      // Arrange
      const formDefinitionWithValidSelectOneFsp: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...startAndEndSurveyItems,
          {
            name: 'fsp',
            type: 'select_one',
            label: ['Financial Service Provider'],
            choices: [
              {
                name: 'Safaricom Kenya',
                label: ['Safaricom Kenya'],
                list_name: 'fsp_options',
              },
              {
                name: 'Intersolve WhatsApp',
                label: ['Intersolve WhatsApp'],
                list_name: 'fsp_options',
              },
            ],
          },
          ...commonFspAttributeFields,
        ],
      };

      // Act & Assert
      await expect(
        service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithValidSelectOneFsp,
          programId,
        }),
      ).resolves.not.toThrow();
    });

    it('should throw HttpException when fsp is select_one but choices do not match FSP configurations', async () => {
      // Arrange
      const formDefinitionWithInvalidSelectOneFsp: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...startAndEndSurveyItems,
          {
            name: 'fsp',
            type: 'select_one',
            label: ['Financial Service Provider'],
            choices: [
              {
                name: 'Invalid FSP Name',
                label: ['Invalid FSP Name'],
                list_name: 'fsp_options',
              },
              {
                name: 'Another Invalid FSP',
                label: ['Another Invalid FSP'],
                list_name: 'fsp_options',
              },
            ],
          },
          ...commonFspAttributeFields,
        ],
      };

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithInvalidSelectOneFsp,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
        [
          {
            "attributeName": "fsp",
            "error": "Attribute 'fsp' has invalid choices: Invalid FSP Name, Another Invalid FSP",
            "info": "Valid FSP configuration names: Safaricom Kenya, Intersolve WhatsApp",
            "solution": "Update choices to match FSP configuration names",
            "type": "invalidChoice",
          },
        ]
      `);
    });

    it.each(['hidden', 'calculate'])(
      'should pass validation when fsp is of type %s',
      async (fspType) => {
        // Arrange
        const formDefinitionWithFspType: KoboFormDefinition = {
          ...baseFormDefinition,
          survey: [
            ...startAndEndSurveyItems,
            {
              name: 'fsp',
              type: fspType,
              label: ['Financial Service Provider'],
              choices: [],
            },
            ...commonFspAttributeFields,
          ],
        };
        // Act & Assert
        await expect(
          service.validateKoboFormDefinition({
            formDefinition: formDefinitionWithFspType,
            programId,
          }),
        ).resolves.not.toThrow();
      },
    );

    it('should throw HttpException when fsp has invalid type', async () => {
      // Arrange
      const formDefinitionWithInvalidFspType: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...startAndEndSurveyItems,
          {
            name: 'fsp',
            type: 'text',
            label: ['Financial Service Provider'],
            choices: [],
          },
          ...commonFspAttributeFields,
        ],
      };

      // Act
      let error: HttpException | any;
      try {
        await service.validateKoboFormDefinition({
          formDefinition: formDefinitionWithInvalidFspType,
          programId,
        });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
      expect(error.response.errors).toMatchInlineSnapshot(`
        [
          {
            "attributeName": "fsp",
            "error": "Attribute 'fsp' has incompatible type 'text'",
            "info": "Expected one of: 'hidden', 'calculate', 'select_one'",
            "solution": "Change the field type to an accepted type",
            "type": "typeMismatch",
          },
        ]
      `);
    });
  });

  it('should throw HttpException when a select_one item has no choices', async () => {
    // Arrange
    (programRepository.findOneOrFail as jest.Mock).mockResolvedValue({
      fullnameNamingConvention: [],
      allowEmptyPhoneNumber: true,
      enableScope: false,
    });
    (programFspConfigurationRepository.find as jest.Mock).mockResolvedValue([]);

    const formDefinitionWithEmptySelectOne: KoboFormDefinition = {
      ...baseFormDefinition,
      survey: [
        ...baseSurveyItems,
        {
          name: 'gender',
          type: 'select_one',
          label: ['What is your gender?'],
          choices: [],
        },
      ],
    };

    // Act
    let error: HttpException | any;
    try {
      await service.validateKoboFormDefinition({
        formDefinition: formDefinitionWithEmptySelectOne,
        programId,
      });
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeHttpExceptionWithStatus(HttpStatus.BAD_REQUEST);
    expect(error.response.errors).toMatchInlineSnapshot(`
      [
        {
          "attributeName": "gender",
          "error": "'gender' is of type select_one but has no choices defined",
          "solution": "Define choices directly in the Kobo form; external CSV choice files are not supported",
          "type": "selectOneNoChoices",
        },
      ]
    `);
  });
});
