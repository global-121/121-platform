import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('KoboService', () => {
  let service: KoboService;
  let koboApiService: KoboApiService;
  let koboValidationService: KoboValidationService;
  let programService: ProgramService;
  let programRepository: ProgramRepository;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let koboSurveyProcessorService: KoboSurveyProcessorService;
  let koboRepository: Repository<KoboEntity>;

  const programId = 1;

  const createMockAsset = (
    languages: string[] = ['English (en)', 'French (fr)'],
  ): KoboAssetDto => {
    return {
      name: 'Test Form',
      content: {
        survey: [
          {
            name: 'phoneNumber',
            type: 'text',
            label: languages.map((lang) => `Phone Number ${lang}`),
            required: true,
            $kuid: 'phone-kuid',
            $xpath: 'phoneNumber',
            $autoname: 'phoneNumber',
          },
        ],
        choices: [],
      },
      summary: {
        languages,
      },
      date_deployed: new Date('2025-01-01'),
      version_id: 'v1',
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboService,
        {
          provide: getRepositoryToken(KoboEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn((data) => data),
          },
        },
        {
          provide: KoboApiService,
          useValue: {
            getDeployedAssetOrThrow: jest.fn(),
            getExistingKoboWebhooks: jest.fn(),
          },
        },
        {
          provide: KoboValidationService,
          useValue: {
            validateKoboFormDefinition: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: KoboSurveyProcessorService,
          useValue: {
            surveyToProgramRegistrationAttributes: jest.fn(),
          },
        },
        {
          provide: ProgramService,
          useValue: {
            findProgramOrThrow: jest.fn(),
            updateProgram: jest.fn(),
            upsertProgramRegistrationAttributes: jest.fn(),
          },
        },
        {
          provide: ProgramRepository,
          useValue: {
            findByIdOrFail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboService>(KoboService);
    koboApiService = module.get<KoboApiService>(KoboApiService);
    koboValidationService = module.get<KoboValidationService>(
      KoboValidationService,
    );
    programService = module.get<ProgramService>(ProgramService);
    programRepository = module.get<ProgramRepository>(ProgramRepository);
    programFspConfigurationRepository =
      module.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
      );
    koboSurveyProcessorService = module.get<KoboSurveyProcessorService>(
      KoboSurveyProcessorService,
    );
    koboRepository = module.get<Repository<KoboEntity>>(
      getRepositoryToken(KoboEntity),
    );

    // Setup common mocks that apply to all tests
    (programService.findProgramOrThrow as jest.Mock).mockResolvedValue({});
    (programFspConfigurationRepository.count as jest.Mock).mockResolvedValue(1);
    (
      koboValidationService.validateKoboFormDefinition as jest.Mock
    ).mockResolvedValue(undefined);
    (koboRepository.findOne as jest.Mock).mockResolvedValue(null);
    (koboRepository.save as jest.Mock).mockResolvedValue({});
    (
      koboSurveyProcessorService.surveyToProgramRegistrationAttributes as jest.Mock
    ).mockReturnValue([
      {
        name: 'phoneNumber',
        type: RegistrationAttributeTypes.text,
        label: { en: 'Phone Number' },
      },
    ]);
    (
      programService.upsertProgramRegistrationAttributes as jest.Mock
    ).mockResolvedValue(undefined);
    (koboApiService.getExistingKoboWebhooks as jest.Mock) = jest
      .fn()
      .mockResolvedValue([]);
  });

  it('should throw HttpException when program has no FSP configurations', async () => {
    // Arrange
    // Override mock to return 0 FSP configurations
    jest.spyOn(programFspConfigurationRepository, 'count').mockResolvedValue(0);

    // Act & Assert
    await expect(
      service.integrateKobo({
        programId,
        assetUid: 'test-asset',
        token: 'test-token',
        url: 'https://kobo.example.com',
        dryRun: false,
      }),
    ).rejects.toMatchInlineSnapshot(
      `[HttpException: Program needs to have at least one FSP configured]`,
    );
  });

  describe('integrateKobo - language addition', () => {
    it('should add new languages from Kobo form to program with no existing languages', async () => {
      // Arrange
      const mockAsset = createMockAsset(['English (en)', 'Spanish (es)']);
      const programWithNoLanguages = {
        id: programId,
        languages: [],
      } as unknown as ProgramEntity;

      // Override specific mocks for this test
      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(programRepository, 'findByIdOrFail')
        .mockResolvedValue(programWithNoLanguages);

      const updateProgramSpy = jest
        .spyOn(programService, 'updateProgram')
        .mockResolvedValue({} as any);

      // Act
      await service.integrateKobo({
        programId,
        assetUid: 'test-asset',
        token: 'test-token',
        url: 'https://kobo.example.com',
        dryRun: false,
      });

      // Assert
      expect(updateProgramSpy).toHaveBeenCalledWith(programId, {
        languages: [
          RegistrationPreferredLanguage.en,
          RegistrationPreferredLanguage.es,
        ],
      });
    });

    it('should merge Kobo languages with existing program languages without duplicates', async () => {
      // Arrange
      const mockAsset = createMockAsset([
        'English (en)',
        'French (fr)',
        'Spanish (es)',
      ]);
      const programWithExistingLanguages = {
        id: programId,
        languages: [
          RegistrationPreferredLanguage.en,
          RegistrationPreferredLanguage.nl,
        ], // Already has English and Dutch
      } as ProgramEntity;

      // Override specific mocks for this test
      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(programRepository, 'findByIdOrFail')
        .mockResolvedValue(programWithExistingLanguages);

      const updateProgramSpy = jest
        .spyOn(programService, 'updateProgram')
        .mockResolvedValue({} as any);

      // Act
      await service.integrateKobo({
        programId,
        assetUid: 'test-asset',
        token: 'test-token',
        url: 'https://kobo.example.com',
        dryRun: false,
      });

      // Assert
      expect(updateProgramSpy).toHaveBeenCalledWith(programId, {
        languages: expect.arrayContaining([
          RegistrationPreferredLanguage.en, // Existing + from Kobo (no duplicate)
          RegistrationPreferredLanguage.nl, // Existing only
          RegistrationPreferredLanguage.fr, // From Kobo only
          RegistrationPreferredLanguage.es, // From Kobo only
        ]),
      });
      // Verify no duplicates
      const calledLanguages = updateProgramSpy.mock.calls[0][1].languages;
      expect(calledLanguages).toHaveLength(4);
      expect(new Set(calledLanguages).size).toBe(4); // All unique
    });

    it('should filter out registration view attributes before upserting program attributes', async () => {
      // Arrange
      const programId = 1;
      const mockAsset = createMockAsset(['English (en)']);
      const programWithLanguages = {
        id: programId,
        languages: [RegistrationPreferredLanguage.en],
      } as ProgramEntity;

      // Mock survey processor to return one regular attribute and one registration view attribute
      const mockAttributes = [
        {
          name: 'customAttribute',
          type: RegistrationAttributeTypes.text,
          label: { en: 'Custom Attribute' },
        },
        {
          name: 'preferredLanguage', // This is in KOBO_ALLOWED_REGISTRATION_VIEW_ATTRIBUTES
          type: RegistrationAttributeTypes.text,
          label: { en: 'Preferred Language' },
        },
      ];

      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(programRepository, 'findByIdOrFail')
        .mockResolvedValue(programWithLanguages);
      jest
        .spyOn(
          koboSurveyProcessorService,
          'surveyToProgramRegistrationAttributes',
        )
        .mockReturnValue(mockAttributes);

      const upsertSpy = jest.spyOn(
        programService,
        'upsertProgramRegistrationAttributes',
      );

      // Act
      await service.integrateKobo({
        programId,
        assetUid: 'test-asset',
        token: 'test-token',
        url: 'https://kobo.example.com',
        dryRun: false,
      });

      // Assert
      expect(upsertSpy).toHaveBeenCalledWith({
        programId,
        programRegistrationAttributes: [
          {
            name: 'customAttribute',
            type: RegistrationAttributeTypes.text,
            label: { en: 'Custom Attribute' },
          },
        ],
      });
      // Verify preferredLanguage was filtered out
      const calledAttributes =
        upsertSpy.mock.calls[0][0].programRegistrationAttributes;
      expect(calledAttributes).toHaveLength(1);
      expect(calledAttributes[0].name).toBe('customAttribute');
    });
  });

  describe('integrateKobo - webhook validation', () => {
    const mockAsset = createMockAsset();

    it('should throw HttpException when Kobo form has one webhook configured', async () => {
      // Arrange
      const existingWebhooks = ['https://example.com/webhook1'];

      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(koboApiService, 'getExistingKoboWebhooks')
        .mockResolvedValue(existingWebhooks);

      // Act & Assert
      await expect(
        service.integrateKobo({
          programId,
          assetUid: 'test-asset',
          token: 'test-token',
          url: 'https://kobo.example.com',
          dryRun: false,
        }),
      ).rejects.toMatchInlineSnapshot(
        `[HttpException: This Kobo form already has a webhook configured: https://example.com/webhook1. Please remove it before integrating with 121 Platform.]`,
      );
    });

    it('should throw HttpException when Kobo form has multiple webhooks configured', async () => {
      // Arrange
      const existingWebhooks = [
        'https://example.com/webhook1',
        'https://example.com/webhook2',
      ];

      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(koboApiService, 'getExistingKoboWebhooks')
        .mockResolvedValue(existingWebhooks);

      // Act & Assert
      await expect(
        service.integrateKobo({
          programId,
          assetUid: 'test-asset',
          token: 'test-token',
          url: 'https://kobo.example.com',
          dryRun: false,
        }),
      ).rejects.toMatchInlineSnapshot(
        `[HttpException: This Kobo form already has 2 webhooks configured: https://example.com/webhook1, https://example.com/webhook2. Please remove them before integrating with 121 Platform.]`,
      );
    });

    it('should successfully integrate when Kobo form has no webhooks', async () => {
      // Arrange
      const programWithLanguages = {
        id: programId,
        languages: [RegistrationPreferredLanguage.en],
      } as ProgramEntity;

      jest
        .spyOn(koboApiService, 'getDeployedAssetOrThrow')
        .mockResolvedValue(mockAsset);
      jest
        .spyOn(koboApiService, 'getExistingKoboWebhooks')
        .mockResolvedValue([]); // No existing webhooks
      jest
        .spyOn(programRepository, 'findByIdOrFail')
        .mockResolvedValue(programWithLanguages);

      // Act
      const result = await service.integrateKobo({
        programId,
        assetUid: 'test-asset',
        token: 'test-token',
        url: 'https://kobo.example.com',
        dryRun: false,
      });

      // Assert
      expect(result).toEqual({
        message: 'Kobo form integrated successfully',
        name: 'Test Form',
        dryRun: false,
      });
    });
  });
});
