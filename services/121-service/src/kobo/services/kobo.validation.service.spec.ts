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
    choices: [],
    languages: ['English (en)'],
    dateDeployed: new Date('2025-04-30T14:49:53.989148Z'),
    versionId: 'v6Y4ZtQE7MJAinjPeQCUqd',
  };

  const successFormDefinition: KoboFormDefinition = {
    ...baseFormDefinition,
    survey: [
      ...baseSurveyItems,
      {
        name: FspAttributes.phoneNumber,
        type: 'text',
        label: ['What is your phone number?', 'Wat is je telefoonnummer?'],
        required: true,
      },
      {
        name: FspAttributes.fullName,
        type: 'text',
        label: ['What is your full name?', 'Wat is je volledige naam?'],
        required: true,
      },
      {
        name: FspAttributes.whatsappPhoneNumber,
        type: 'text',
        label: ['WhatsApp phone number', 'WhatsApp telefoonnummer'],
        required: false,
      },
      {
        name: FspAttributes.nationalId,
        type: 'text',
        label: ['National ID number', 'Nationale ID nummer'],
        required: false,
      },
    ],
    choices: [
      {
        name: 'yes',
        $kuid: 'Op4dDqyni',
        label: ['Yes', 'Ja'],
        list_name: 'yes_no',
        $autovalue: 'yes',
      },
      {
        name: 'no',
        $kuid: 'zExJMwth7',
        label: ['No', 'Nee'],
        list_name: 'yes_no',
        $autovalue: 'no',
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
    // Clear mocks before each test
    jest.clearAllMocks();

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

  describe('validateKoboFormDefinition', () => {
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
            ...baseSurveyItems,
            {
              name: FspAttributes.phoneNumber,
              type: 'text',
              label: [
                'What is your phone number?',
                'Wat is je telefoonnummer?',
              ],
              required: true,
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
    });

    describe('validate fsp attribute types', () => {
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
            ...baseSurveyItems,
            {
              name: FspAttributes.nationalId,
              type: 'integer', // Wrong type nationalId is text
              label: ['National ID number', 'Nationale ID nummer'],
              required: false,
            },
            {
              name: FspAttributes.phoneNumber,
              type: 'text', // correct type
              label: [
                'What is your phone number?',
                'Wat is je telefoonnummer?',
              ],
              required: true,
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
         - Kobo form attribute "nationalId" has incompatible type for 121 attribute: expected: "text, select_multiple, select_multiple_from_file, rank, geopoint, geotrace, geoshape, date, time, dateTime, image, audio, background-audio, video, file, barcode, calculate, acknowledge, hidden, xml-external", got "integer"  "
        `);
      });
    });
  });

  describe('fullnameNamingConvention attributes validation', () => {
    it('should pass validation when all fullnameNamingConvention attributes are present', async () => {
      // Arrange
      const programId = 1;
      const mockFspConfigs = [];

      const formDefinitionWithAllFullNameAttributes: KoboFormDefinition = {
        ...baseFormDefinition,
        survey: [
          ...baseSurveyItems,
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            required: true,
          },
          {
            name: 'lastName',
            type: 'text',
            label: ['Last name'],
            required: true,
          },
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return specific fullnameNamingConvention
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
          ...baseSurveyItems,
          {
            name: 'firstName',
            type: 'text',
            label: ['First name'],
            required: true,
          },
          // Missing lastName and middleName from fullnameNamingConvention
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return specific fullnameNamingConvention with missing attributes
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
      expect(error.message).toContain(
        'Kobo form must contain the following name attributes defined in program.fullnameNamingConvention',
      );
      expect(error.message).toContain('lastName, middleName');
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
          ...baseSurveyItems,
          {
            name: FspAttributes.phoneNumber,
            type: 'text',
            label: ['Phone number'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return allowEmptyPhoneNumber: false
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
          ...baseSurveyItems,
          // Missing phoneNumber field
        ],
      };

      // Override programRepository mock to return allowEmptyPhoneNumber: false
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
          ...baseSurveyItems,
          // Missing phoneNumber field
        ],
      };

      // Override programRepository mock to return allowEmptyPhoneNumber: true
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
          ...baseSurveyItems,
          {
            name: FspAttributes.phoneNumber,
            type: 'integer', // Wrong type - should be text
            label: ['Phone number'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return allowEmptyPhoneNumber: false
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
          ...baseSurveyItems,
          // No scope field present
        ],
      };

      // Override programRepository mock to return enableScope: false
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
          ...baseSurveyItems,
          {
            name: GenericRegistrationAttributes.scope,
            type: 'text',
            label: ['Scope'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return enableScope: true
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
          ...baseSurveyItems,
          // Missing scope field
        ],
      };

      // Override programRepository mock to return enableScope: true
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
          ...baseSurveyItems,
          {
            name: GenericRegistrationAttributes.scope,
            type: 'integer', // Wrong type - should be text
            label: ['Scope'],
            required: true,
          },
        ],
      };

      // Override programRepository mock to return enableScope: true
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
       - Kobo form attribute "scope" has incompatible type for 121 attribute: expected: "text, select_multiple, select_multiple_from_file, rank, geopoint, geotrace, geoshape, date, time, dateTime, image, audio, background-audio, video, file, barcode, calculate, acknowledge, hidden, xml-external", got "integer"  "
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
          ...baseSurveyItems,
          {
            name: 'matrix_question',
            type: 'begin_kobomatrix',
            label: ['Matrix question group'],
            required: false,
          },
        ],
      };

      // Override programRepository mock with default values
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
});
