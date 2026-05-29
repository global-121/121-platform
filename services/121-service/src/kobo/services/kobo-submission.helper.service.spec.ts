import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboRegistrationInput } from '@121-service/src/kobo/interfaces/kobo-registration-input.interface';
import { KoboService } from '@121-service/src/kobo/services/kobo.service';
import { KoboSubmissionHelperService } from '@121-service/src/kobo/services/kobo-submission.helper.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationsCreationService } from '@121-service/src/registration/services/registrations-creation.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';

describe('KoboSubmissionHelperService', () => {
  let service: KoboSubmissionHelperService;
  let koboService: jest.Mocked<KoboService>;
  let registrationRepository: jest.Mocked<Repository<RegistrationEntity>>;
  let registrationsInputValidator: jest.Mocked<RegistrationsInputValidator>;
  let registrationsCreationService: jest.Mocked<RegistrationsCreationService>;

  const mockProgram = {
    id: 1,
    titlePortal: { en: 'Test Program' },
  } as ProgramEntity;

  const userId = 42;

  const registrationDataArray: KoboRegistrationInput[] = [
    {
      referenceId: 'uuid-1',
      programFspConfigurationName: 'Safaricom',
      fullName: 'John Doe',
      phoneNumber: '+31612345678',
    },
    {
      referenceId: 'uuid-2',
      programFspConfigurationName: 'Safaricom',
      fullName: 'Jane Doe',
      phoneNumber: '+31698765432',
    },
  ];

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KoboSubmissionHelperService,
        {
          provide: KoboService,
          useValue: {
            getFormDefinitionOrThrow: jest.fn(),
            applyFormDefinitionToProgram: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RegistrationEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: RegistrationsInputValidator,
          useValue: {
            validateAndCleanInput: jest.fn(),
          },
        },
        {
          provide: RegistrationsCreationService,
          useValue: {
            importValidatedRegistrations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<KoboSubmissionHelperService>(
      KoboSubmissionHelperService,
    );
    koboService = module.get(KoboService);
    registrationRepository = module.get(getRepositoryToken(RegistrationEntity));
    registrationsInputValidator = module.get(RegistrationsInputValidator);
    registrationsCreationService = module.get(RegistrationsCreationService);
  });

  describe('updateProgramToNewVersionIfApplicable', () => {
    const baseVersionParams = {
      currentVersion: 'v1',
      currentVersionDateDeployed: new Date('2024-01-01'),
      formVersionFromIncomingSubmission: 'v2',
      assetUid: 'test-asset-uid',
      token: 'mock-token',
      url: 'https://kobo.example.com',
      programId: 1,
    };

    it('should update program when incoming version is newer', async () => {
      // Arrange
      const newerDateDeployed = new Date('2025-06-01');
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({
          dateDeployed: newerDateDeployed,
          versionId: 'v2',
        }),
      );
      koboService.applyFormDefinitionToProgram.mockResolvedValue(undefined);

      // Act
      await service.updateProgramToNewVersionIfApplicable(baseVersionParams);

      // Assert
      expect(koboService.applyFormDefinitionToProgram).toHaveBeenCalledWith({
        formDefinition: expect.objectContaining({
          versionId: 'v2',
          dateDeployed: newerDateDeployed,
        }),
        programId: 1,
        currentVersionId: 'v1',
      });
    });

    it('should skip update when versions match', async () => {
      // Act
      await service.updateProgramToNewVersionIfApplicable({
        ...baseVersionParams,
        formVersionFromIncomingSubmission: 'v1',
      });

      // Assert
      expect(koboService.getFormDefinitionOrThrow).not.toHaveBeenCalled();
    });

    it('should skip update when incoming version is older', async () => {
      // Arrange
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({
          dateDeployed: new Date('2023-01-01'), // Older than current
        }),
      );

      // Act
      await service.updateProgramToNewVersionIfApplicable(baseVersionParams);

      // Assert
      expect(koboService.applyFormDefinitionToProgram).not.toHaveBeenCalled();
    });

    it('should throw when form validation fails', async () => {
      // Arrange
      const validationError = new HttpException(
        'Kobo form definition validation failed',
        HttpStatus.BAD_REQUEST,
      );
      koboService.getFormDefinitionOrThrow.mockResolvedValue(
        buildMockFormDefinition({ versionId: 'v2' }),
      );
      koboService.applyFormDefinitionToProgram.mockRejectedValue(
        validationError,
      );

      // Act & Assert
      await expect(
        service.updateProgramToNewVersionIfApplicable(baseVersionParams),
      ).rejects.toThrow(validationError);
    });
  });

  describe('filter submissions ids already existing', () => {
    it('should return set of existing reference IDs', async () => {
      // Arrange
      registrationRepository.find.mockResolvedValue([
        { referenceId: 'uuid-1' } as RegistrationEntity,
        { referenceId: 'uuid-3' } as RegistrationEntity,
      ]);

      // Act
      const result = await service.filterAlreadyExistingSubmissionUuids([
        'uuid-1',
        'uuid-2',
        'uuid-3',
      ]);

      // Assert
      expect(result).toEqual(new Set(['uuid-1', 'uuid-3']));
    });

    it('should return empty set for empty input', async () => {
      // Act
      const result = await service.filterAlreadyExistingSubmissionUuids([]);

      // Assert
      expect(result).toEqual(new Set());
      expect(registrationRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('validateAndImportAsRegistrations', () => {
    it('should return correct counts when all submissions import successfully', async () => {
      // Arrange
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: registrationDataArray.map((r) => ({
          ...r,
          data: {},
        })),
        errors: [],
      });
      registrationsCreationService.importValidatedRegistrations.mockResolvedValue(
        { aggregateImportResult: { countImported: 2 } },
      );

      // Act
      const result = await service.validateAndImportAsRegistrations({
        registrationDataArray,
        program: mockProgram,
        userId,
        numberOfSubmissionsOnForm: 5,
        numberOfSubmissionsSkipped: 3,
      });

      // Assert
      expect(result).toEqual({
        numberOfSubmissionsOnForm: 5,
        numberOfSubmissionsImported: 2,
        numberOfSubmissionsSkipped: 3,
        numberOfSubmissionsFailed: 0,
        validationErrors: [],
      });
    });

    it('should return flat validation errors with referenceId', async () => {
      // Arrange
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: [],
        errors: [
          {
            index: 0,
            referenceId: 'uuid-1',
            column: 'phoneNumber',
            error: 'Value is not valid',
            value: 'invalid',
          },
          {
            index: 0,
            referenceId: 'uuid-1',
            column: 'fullName',
            error: 'Value is required',
            value: '',
          },
          {
            index: 1,
            referenceId: 'uuid-2',
            column: 'programFspConfigurationName',
            error: 'FSP not found',
            value: 'InvalidFsp',
          },
        ],
      });
      registrationsCreationService.importValidatedRegistrations.mockResolvedValue(
        { aggregateImportResult: { countImported: 0 } },
      );

      // Act
      const result = await service.validateAndImportAsRegistrations({
        registrationDataArray,
        program: mockProgram,
        userId,
        numberOfSubmissionsOnForm: 2,
        numberOfSubmissionsSkipped: 0,
      });

      // Assert
      expect(result.validationErrors).toEqual([
        {
          referenceId: 'uuid-1',
          column: 'phoneNumber',
          error: 'Value is not valid',
        },
        {
          referenceId: 'uuid-1',
          column: 'fullName',
          error: 'Value is required',
        },
        {
          referenceId: 'uuid-2',
          column: 'programFspConfigurationName',
          error: 'FSP not found',
        },
      ]);
      expect(result.numberOfSubmissionsFailed).toBe(2);
    });

    it('should handle partial success with some valid and some invalid submissions', async () => {
      // Arrange
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: [{ ...registrationDataArray[0], data: {} }],
        errors: [
          {
            index: 1,
            referenceId: 'uuid-2',
            column: 'phoneNumber',
            error: 'Value is not valid',
            value: 'bad-phone',
          },
        ],
      });
      registrationsCreationService.importValidatedRegistrations.mockResolvedValue(
        { aggregateImportResult: { countImported: 1 } },
      );

      // Act
      const result = await service.validateAndImportAsRegistrations({
        registrationDataArray,
        program: mockProgram,
        userId,
        numberOfSubmissionsOnForm: 5,
        numberOfSubmissionsSkipped: 3,
      });

      // Assert
      expect(result).toEqual({
        numberOfSubmissionsOnForm: 5,
        numberOfSubmissionsImported: 1,
        numberOfSubmissionsSkipped: 3,
        numberOfSubmissionsFailed: 1,
        validationErrors: [
          {
            referenceId: 'uuid-2',
            column: 'phoneNumber',
            error: 'Value is not valid',
          },
        ],
      });
    });

    it('should handle empty registration data array', async () => {
      // Arrange
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: [],
        errors: [],
      });
      registrationsCreationService.importValidatedRegistrations.mockResolvedValue(
        { aggregateImportResult: { countImported: 0 } },
      );

      // Act
      const result = await service.validateAndImportAsRegistrations({
        registrationDataArray: [],
        program: mockProgram,
        userId,
        numberOfSubmissionsOnForm: 3,
        numberOfSubmissionsSkipped: 3,
      });

      // Assert
      expect(result).toEqual({
        numberOfSubmissionsOnForm: 3,
        numberOfSubmissionsImported: 0,
        numberOfSubmissionsSkipped: 3,
        numberOfSubmissionsFailed: 0,
        validationErrors: [],
      });
    });

    it('should pass correct parameters to validator and import service', async () => {
      // Arrange
      const validatedRegistrations = registrationDataArray.map((r) => ({
        ...r,
        data: {},
      }));
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: validatedRegistrations,
        errors: [],
      });
      registrationsCreationService.importValidatedRegistrations.mockResolvedValue(
        { aggregateImportResult: { countImported: 2 } },
      );

      // Act
      await service.validateAndImportAsRegistrations({
        registrationDataArray,
        program: mockProgram,
        userId,
        numberOfSubmissionsOnForm: 2,
        numberOfSubmissionsSkipped: 0,
      });

      // Assert
      expect(
        registrationsInputValidator.validateAndCleanInput,
      ).toHaveBeenCalledWith({
        registrationInputArray: registrationDataArray,
        programId: mockProgram.id,
        userId,
        typeOfInput: 'create',
        validationConfig: {
          validateExistingReferenceId: true,
        },
      });
      expect(
        registrationsCreationService.importValidatedRegistrations,
      ).toHaveBeenCalledWith({
        validatedImportRecords: validatedRegistrations,
        program: mockProgram,
        userId,
      });
    });
  });

  describe('assertErrorsHaveReferenceId (via validateAndImportAsRegistrations)', () => {
    it('should throw when a validation error has no referenceId', async () => {
      // Arrange
      registrationsInputValidator.validateAndCleanInput.mockResolvedValue({
        validRegistrations: [],
        errors: [
          {
            index: 0,
            referenceId: undefined,
            column: 'phoneNumber',
            error: 'Value is not valid',
            value: 'invalid',
          },
        ],
      });

      // Act & Assert
      await expect(
        service.validateAndImportAsRegistrations({
          registrationDataArray: [],
          program: mockProgram,
          userId,
          numberOfSubmissionsOnForm: 1,
          numberOfSubmissionsSkipped: 0,
        }),
      ).rejects.toThrow(
        "Expected referenceId on all Kobo validation errors, but column 'phoneNumber' had none",
      );
    });
  });
});
