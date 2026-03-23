import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationsCreationService } from '@121-service/src/registration/services/registrations-creation.service';

import '@121-service/src/utils/test-helpers/matchers/httpExceptionMatcher';

describe('KoboSubmissionService', () => {
  let service: KoboSubmissionService;
  let koboRepository: jest.Mocked<Repository<KoboEntity>>;
  let koboApiService: jest.Mocked<KoboApiService>;
  let koboService: jest.Mocked<KoboService>;
  let registrationsCreationService: jest.Mocked<RegistrationsCreationService>;
  let registrationScopedRepository: jest.Mocked<RegistrationScopedRepository>;

  const successSubmissionUuid = 'success-submission-uuid';
  const assetUid = 'test-asset-uid';
  const fspName = 'Safaricom';
  const fullName = 'John Doe';
  const nationalId = '123456789';
  const phoneNumber = '+31612345678';
  const photoDownloadUrl =
    'https://kobo.example.com/api/v2/assets/test/data/1/attachments/1';

  const mockProgram = {
    id: 1,
    titlePortal: { en: 'Test Program' },
  } as ProgramEntity;

  const mockKoboEntity: Partial<KoboEntity> = {
    id: 1,
    programId: 1,
    versionId: 'v1',
    token: 'mock-token',
    url: 'https://kobo.example.com',
    assetUid,
    program: mockProgram,
  };

  const mockSubmission = {
    _id: 1,
    _uuid: successSubmissionUuid,
    _xform_id_string: assetUid,
    _submission_time: '2025-04-30T15:30:00.000Z',
    _status: 'submitted_via_web',
    __version__: 'v1',
    start: '2025-04-30T15:29:00.000Z',
    end: '2025-04-30T15:30:00.000Z',
    fsp: fspName,
    fullName,
    nationalId,
    phoneNumber,
    photo: 'username/attachments/form-id/submission-uuid/important_photo.jpg',
    _attachments: [
      {
        filename:
          'username/attachments/form-id/submission-uuid/important_photo.jpg',
        download_url: photoDownloadUrl,
        mimetype: 'image/jpeg',
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboSubmissionService,
        {
          provide: getRepositoryToken(KoboEntity),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: KoboApiService,
          useValue: {
            getSubmission: jest.fn(),
            getAllSubmissions: jest.fn(),
          },
        },
        {
          provide: KoboService,
          useValue: {
            getFormDefinitionOrThrow: jest.fn(),
            validateFormAndUpdateProgram: jest.fn(),
          },
        },
        {
          provide: RegistrationsCreationService,
          useValue: {
            importRegistrations: jest.fn(),
          },
        },
        {
          provide: RegistrationScopedRepository,
          useValue: {
            getReferenceIdsByProgramId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboSubmissionService>(KoboSubmissionService);
    koboRepository = module.get(getRepositoryToken(KoboEntity));
    koboApiService = module.get(KoboApiService);
    koboService = module.get(KoboService);
    registrationsCreationService = module.get(RegistrationsCreationService);
    registrationScopedRepository = module.get(RegistrationScopedRepository);
  });

  describe('processKoboWebhookCall', () => {
    const incomingWebhook: KoboWebhookIncomingSubmission = {
      _uuid: successSubmissionUuid,
      _xform_id_string: assetUid,
      __version__: mockKoboEntity.versionId!, // Same version → skips program update
    };

    it('should successfully process a Kobo webhook and import registration (happy flow)', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);
      koboApiService.getSubmission.mockResolvedValue(mockSubmission);
      registrationsCreationService.importRegistrations.mockResolvedValue({
        aggregateImportResult: {
          countImported: 1,
        },
      });

      // Act
      await service.processKoboWebhookCall(incomingWebhook);

      // Assert
      expect(
        registrationsCreationService.importRegistrations,
      ).toHaveBeenCalledWith({
        inputRegistrations: [
          {
            referenceId: successSubmissionUuid,
            programFspConfigurationName: fspName,
            fullName,
            nationalId,
            phoneNumber,
            photo: photoDownloadUrl,
          },
        ],
        program: mockProgram,
        userId: null,
      });
    });

    it('should throw HttpException when Kobo integration is not found', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(null);

      // Act
      let error: any;
      try {
        await service.processKoboWebhookCall(incomingWebhook);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.NOT_FOUND);
      expect(error.message).toMatchInlineSnapshot(
        `"Kobo integration not found for this program"`,
      );
    });
  });

  describe('handle form version in incoming submission', () => {
    function buildMockFormDefinition(
      overrides: Partial<KoboFormDefinition>,
    ): KoboFormDefinition {
      return {
        name: 'Test Form',
        survey: [],
        languages: ['English (en)'],
        dateDeployed: new Date('2025-06-01'),
        versionId: 'mock-version-id',
        ...overrides,
      };
    }

    beforeEach(() => {
      koboApiService.getSubmission.mockResolvedValue(mockSubmission);
      registrationsCreationService.importRegistrations.mockResolvedValue({
        aggregateImportResult: { countImported: 1 },
      });
    });

    it('should update program when incoming submission has a newer form version', async () => {
      // Arrange
      const newerVersionId = 'mock-id-newer-version';
      const newerDateDeployed = new Date('2025-06-01');
      const koboEntityWithOlderVersion = {
        ...mockKoboEntity,
        dateDeployed: new Date('2024-01-01'),
      } as KoboEntity;

      koboRepository.findOne.mockResolvedValue(koboEntityWithOlderVersion);
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({
          dateDeployed: newerDateDeployed,
          versionId: newerVersionId,
        }),
      );
      koboService.validateFormAndUpdateProgram.mockResolvedValue(undefined);

      // Act
      await service.processKoboWebhookCall({
        _uuid: successSubmissionUuid,
        _xform_id_string: assetUid,
        __version__: newerVersionId,
      });

      // Assert
      expect(koboService.validateFormAndUpdateProgram).toHaveBeenCalledWith({
        formDefinition: expect.objectContaining({ versionId: newerVersionId }),
        programId: mockProgram.id,
      });
      expect(koboRepository.update).toHaveBeenCalledWith(
        { versionId: mockKoboEntity.versionId },
        {
          versionId: newerVersionId,
          dateDeployed: newerDateDeployed,
        },
      );
    });

    it('should not update program when incoming submission has an older form version', async () => {
      // Arrange
      const olderVersionId = 'mock-id-older-version';
      koboRepository.findOne.mockResolvedValue({
        ...mockKoboEntity,
        dateDeployed: new Date('2025-06-01'), // Current version is newer
      } as KoboEntity);
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({
          dateDeployed: new Date('2024-01-01'), // Older than current
          versionId: olderVersionId,
        }),
      );

      // Act
      await service.processKoboWebhookCall({
        _uuid: successSubmissionUuid,
        _xform_id_string: assetUid,
        __version__: olderVersionId,
      });

      // Assert
      expect(koboService.validateFormAndUpdateProgram).not.toHaveBeenCalled();
    });

    it('should throw and not update program when form validation fails', async () => {
      // Arrange
      const newerVersionId = 'mock-id-newer-version';
      const validationError = new HttpException(
        'Kobo form definition validation failed:\n- phoneNumber is missing a label for language English (en)',
        HttpStatus.BAD_REQUEST,
      );

      koboRepository.findOne.mockResolvedValue({
        ...mockKoboEntity,
        dateDeployed: new Date('2024-01-01'),
      } as KoboEntity);
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({ versionId: newerVersionId }),
      );
      koboService.validateFormAndUpdateProgram.mockRejectedValue(
        validationError,
      );

      // Act & Assert
      await expect(
        service.processKoboWebhookCall({
          _uuid: successSubmissionUuid,
          _xform_id_string: assetUid,
          __version__: newerVersionId,
        }),
      ).rejects.toThrow(validationError);
      expect(koboService.validateFormAndUpdateProgram).toHaveBeenCalled();
    });
  });

  describe('importNewSubmissions', () => {
    const mockSubmission2 = {
      ...mockSubmission,
      _id: 2,
      _uuid: 'new-submission-uuid',
      fullName: 'Jane Doe',
      nationalId: '987654321',
      phoneNumber: '+31698765432',
    };

    it('should successfully import new submissions (happy flow)', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);
      koboApiService.getAllSubmissions.mockResolvedValue({
        count: 2,
        submissions: [mockSubmission, mockSubmission2],
      });
      registrationScopedRepository.getReferenceIdsByProgramId.mockResolvedValue(
        new Set([successSubmissionUuid]), // First submission already exists
      );
      registrationsCreationService.importRegistrations.mockResolvedValue({
        aggregateImportResult: { countImported: 1 },
      });

      // Act
      const result = await service.importNewSubmissions({
        programId: 1,
        userId: 42,
      });

      // Assert
      expect(
        registrationsCreationService.importRegistrations,
      ).toHaveBeenCalledWith({
        inputRegistrations: [
          expect.objectContaining({
            referenceId: 'new-submission-uuid',
            fullName: 'Jane Doe',
          }),
        ],
        program: mockProgram,
        userId: 42,
      });
      expect(result).toEqual({
        aggregateImportResult: { countImported: 1 },
      });
    });

    it('should throw HttpException when Kobo integration is not found', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(null);

      // Act
      let error: any;
      try {
        await service.importNewSubmissions({ programId: 1, userId: 42 });
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeHttpExceptionWithStatus(HttpStatus.NOT_FOUND);
      expect(error.message).toMatchInlineSnapshot(
        `"Kobo integration not found for this program"`,
      );
    });

    it('should throw HttpException when there are too many submissions to import', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);
      koboApiService.getAllSubmissions.mockResolvedValue({
        count: 1001,
        submissions: [],
      });
      registrationScopedRepository.getReferenceIdsByProgramId.mockResolvedValue(
        new Set(),
      );

      // Act
      const promise = service.importNewSubmissions({
        programId: 1,
        userId: 42,
      });

      // Assert
      await expect(promise).rejects.toBeHttpExceptionWithStatus(
        HttpStatus.BAD_REQUEST,
      );
      await expect(promise).rejects.toHaveProperty(
        'message',
        expect.stringContaining('Too many new submissions to import'),
      );
    });

    it('should filter out already existing registrations', async () => {
      // Arrange
      koboRepository.findOne.mockResolvedValue(mockKoboEntity as KoboEntity);
      koboApiService.getAllSubmissions.mockResolvedValue({
        count: 2,
        submissions: [mockSubmission, mockSubmission2],
      });
      // Both submissions already exist
      registrationScopedRepository.getReferenceIdsByProgramId.mockResolvedValue(
        new Set([successSubmissionUuid, 'new-submission-uuid']),
      );
      registrationsCreationService.importRegistrations.mockResolvedValue({
        aggregateImportResult: { countImported: 0 },
      });

      // Act
      await service.importNewSubmissions({ programId: 1, userId: 42 });

      // Assert
      expect(
        registrationsCreationService.importRegistrations,
      ).toHaveBeenCalledWith({
        inputRegistrations: [],
        program: mockProgram,
        userId: 42,
      });
    });
  });
});
