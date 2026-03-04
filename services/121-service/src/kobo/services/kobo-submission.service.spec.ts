import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboValidationService } from '@121-service/src/kobo/services/kobo.validation.service';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';

import '@121-service/src/utils/test-helpers/matchers/httpExceptionMatcher';

describe('KoboSubmissionService', () => {
  let service: KoboSubmissionService;
  let koboRepository: jest.Mocked<Repository<KoboEntity>>;
  let koboApiService: jest.Mocked<KoboApiService>;
  let koboService: jest.Mocked<KoboService>;
  let koboValidationService: jest.Mocked<KoboValidationService>;
  let registrationsImportService: jest.Mocked<RegistrationsImportService>;

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
            getDeployedAssetOrThrow: jest.fn(),
          },
        },
        {
          provide: KoboService,
          useValue: {
            syncProgramWithKoboForm: jest.fn(),
          },
        },
        {
          provide: KoboValidationService,
          useValue: {
            validateKoboFormDefinition: jest.fn(),
          },
        },
        {
          provide: RegistrationsImportService,
          useValue: {
            importRegistrations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboSubmissionService>(KoboSubmissionService);
    koboRepository = module.get(getRepositoryToken(KoboEntity));
    koboApiService = module.get(KoboApiService);
    koboService = module.get(KoboService);
    koboValidationService = module.get(KoboValidationService);
    registrationsImportService = module.get(RegistrationsImportService);

    jest.clearAllMocks();
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
      registrationsImportService.importRegistrations.mockResolvedValue({
        aggregateImportResult: {
          countImported: 1,
        },
      });

      // Act
      await service.processKoboWebhookCall(incomingWebhook);

      // Assert
      expect(
        registrationsImportService.importRegistrations,
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
    beforeEach(() => {
      koboApiService.getSubmission.mockResolvedValue(mockSubmission);
      registrationsImportService.importRegistrations.mockResolvedValue({
        aggregateImportResult: { countImported: 1 },
      });
    });

    it('should sync program when incoming submission has a newer form version', async () => {
      // Arrange
      const newerVersionId = 'mock-id-newer-version';
      const koboEntityWithOlderVersion = {
        ...mockKoboEntity,
        dateDeployed: new Date('2024-01-01'),
      } as KoboEntity;
      const mockAssetWithNewVersion = {
        name: 'Test Form',
        content: { survey: [], choices: [] },
        summary: { languages: ['English (en)'] },
        date_deployed: new Date('2025-06-01'),
        version_id: newerVersionId,
      };

      koboRepository.findOne.mockResolvedValue(koboEntityWithOlderVersion);
      koboApiService.getDeployedAssetOrThrow.mockResolvedValue(
        mockAssetWithNewVersion as any,
      );
      koboValidationService.validateKoboFormDefinition.mockResolvedValue(
        undefined,
      );

      // Act
      await service.processKoboWebhookCall({
        _uuid: successSubmissionUuid,
        _xform_id_string: assetUid,
        __version__: newerVersionId,
      });

      // Assert
      expect(koboService.syncProgramWithKoboForm).toHaveBeenCalledWith({
        formDefinition: expect.objectContaining({ versionId: newerVersionId }),
        programId: mockProgram.id,
      });
      expect(koboRepository.update).toHaveBeenCalledWith(
        { versionId: mockKoboEntity.versionId },
        {
          versionId: newerVersionId,
          dateDeployed: new Date(mockAssetWithNewVersion.date_deployed),
        },
      );
    });

    it('should not sync program when incoming submission has an older form version', async () => {
      // Arrange
      const olderVersionId = 'mock-id-older-version';
      koboRepository.findOne.mockResolvedValue({
        ...mockKoboEntity,
        dateDeployed: new Date('2025-06-01'), // Current version is newer
      } as KoboEntity);
      koboApiService.getDeployedAssetOrThrow.mockResolvedValue({
        name: 'Test Form',
        content: { survey: [], choices: [] },
        summary: { languages: ['English (en)'] },
        date_deployed: new Date('2024-01-01'), // Older than current
        version_id: olderVersionId,
      } as any);
      koboValidationService.validateKoboFormDefinition.mockResolvedValue(
        undefined,
      );

      // Act
      await service.processKoboWebhookCall({
        _uuid: successSubmissionUuid,
        _xform_id_string: assetUid,
        __version__: olderVersionId,
      });

      // Assert
      expect(koboService.syncProgramWithKoboForm).not.toHaveBeenCalled();
    });

    it('should throw and not sync program when form validation fails', async () => {
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
      koboApiService.getDeployedAssetOrThrow.mockResolvedValue({
        name: 'Test Form',
        content: { survey: [], choices: [] },
        summary: { languages: ['English (en)'] },
        date_deployed: new Date('2025-06-01'),
        version_id: newerVersionId,
      } as any);
      koboValidationService.validateKoboFormDefinition.mockRejectedValue(
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
      expect(koboService.syncProgramWithKoboForm).not.toHaveBeenCalled();
    });
  });
});
