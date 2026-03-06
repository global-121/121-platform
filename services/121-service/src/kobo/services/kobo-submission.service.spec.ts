import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboWebhookIncomingSubmission } from '@121-service/src/kobo/dtos/kobo-webhook-incoming-submission.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboApiService } from '@121-service/src/kobo/services/kobo-api.service';
import { KoboSubmissionService } from '@121-service/src/kobo/services/kobo-submission.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';

import '@121-service/src/utils/test-helpers/matchers/httpExceptionMatcher';

describe('KoboSubmissionService', () => {
  let service: KoboSubmissionService;
  let koboRepository: jest.Mocked<Repository<KoboEntity>>;
  let koboApiService: jest.Mocked<KoboApiService>;
  let registrationsImportService: jest.Mocked<RegistrationsImportService>;

  const successSubmissionUuid = 'success-submission-uuid';
  const assetUid = 'test-asset-uid';
  const fspName = 'Safaricom';
  const fullName = 'John Doe';
  const nationalId = '123456789';
  const phoneNumber = '+31612345678';

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboSubmissionService,
        {
          provide: getRepositoryToken(KoboEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: KoboApiService,
          useValue: {
            getSubmission: jest.fn(),
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
    registrationsImportService = module.get(RegistrationsImportService);

    jest.clearAllMocks();
  });

  describe('processKoboWebhookCall', () => {
    const incomingWebhook: KoboWebhookIncomingSubmission = {
      _uuid: successSubmissionUuid,
      _xform_id_string: assetUid,
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
});
