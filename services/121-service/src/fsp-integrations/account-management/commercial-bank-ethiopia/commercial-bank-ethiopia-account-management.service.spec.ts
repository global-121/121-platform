import { Test, TestingModule } from '@nestjs/testing';

import { CommercialBankEthiopiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/commercial-bank-ethiopia/commercial-bank-ethiopia-account-management.service';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

describe('CommercialBankEthiopiaAccountManagementService', () => {
  let service: CommercialBankEthiopiaAccountManagementService;
  let commercialBankEthiopiaApiService: jest.Mocked<CommercialBankEthiopiaApiService>;
  let commercialBankEthiopiaService: jest.Mocked<CommercialBankEthiopiaService>;
  let commercialBankEthiopiaAccountEnquiriesScopedRepo: jest.Mocked<
    ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>
  >;

  const mockCredentials = {
    username: 'test-user',
    password: 'test-password',
  };

  const mockRegistrations = [
    {
      id: 1,
      fullName: 'John Doe',
      bankAccountNumber: '1234567890',
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      bankAccountNumber: '0987654321',
    },
  ];

  const mockSuccessfulValidationResult = {
    Status: {
      successIndicator: {
        _text: 'Success',
      },
    },
    EACCOUNTCBEREMITANCEType: {
      'ns4:gEACCOUNTCBEREMITANCEDetailType': {
        'ns4:mEACCOUNTCBEREMITANCEDetailType': {
          'ns4:CUSTOMERNAME': {
            _text: 'John Doe',
          },
          'ns4:ACCOUNTSTATUS': {
            _text: 'Active',
          },
        },
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommercialBankEthiopiaAccountManagementService,
        {
          provide: ProgramRepository,
          useValue: {
            getAllProgramIdsWithFsp: jest.fn(),
          },
        },
        {
          provide: CommercialBankEthiopiaService,
          useValue: {
            getCommercialBankEthiopiaCredentialsOrThrow: jest.fn(),
          },
        },
        {
          provide: CommercialBankEthiopiaApiService,
          useValue: {
            getValidationStatus: jest.fn(),
          },
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: {
            getQueryBuilderFilterByFsp: jest.fn(),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationViewsNoLimit: jest.fn(),
          },
        },
        {
          provide: getScopedRepositoryProviderName(
            CommercialBankEthiopiaAccountEnquiriesEntity,
          ),
          useValue: {
            findOne: jest.fn(),
            updateUnscoped: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommercialBankEthiopiaAccountManagementService>(
      CommercialBankEthiopiaAccountManagementService,
    );
    commercialBankEthiopiaApiService =
      module.get<CommercialBankEthiopiaApiService>(
        CommercialBankEthiopiaApiService,
      ) as jest.Mocked<CommercialBankEthiopiaApiService>;
    commercialBankEthiopiaService = module.get<CommercialBankEthiopiaService>(
      CommercialBankEthiopiaService,
    ) as jest.Mocked<CommercialBankEthiopiaService>;
    commercialBankEthiopiaAccountEnquiriesScopedRepo = module.get(
      getScopedRepositoryProviderName(
        CommercialBankEthiopiaAccountEnquiriesEntity,
      ),
    ) as jest.Mocked<
      ScopedRepository<CommercialBankEthiopiaAccountEnquiriesEntity>
    >;

    // Set up default mocks for getAllRegistrationData
    jest
      .spyOn(service, 'getAllRegistrationData')
      .mockResolvedValue(mockRegistrations);

    commercialBankEthiopiaService.getCommercialBankEthiopiaCredentialsOrThrow.mockResolvedValue(
      mockCredentials,
    );
  });

  describe('retrieveAndUpsertAccountEnquiriesForProgram', () => {
    const programId = 1;

    it('should successfully retrieve and upsert account enquiries for all registrations (happy flow)', async () => {
      // Arrange
      commercialBankEthiopiaApiService.getValidationStatus.mockResolvedValue(
        mockSuccessfulValidationResult,
      );
      commercialBankEthiopiaAccountEnquiriesScopedRepo.findOne.mockResolvedValue(
        null,
      );
      commercialBankEthiopiaAccountEnquiriesScopedRepo.save.mockResolvedValue([
        {} as CommercialBankEthiopiaAccountEnquiriesEntity,
      ]);

      // Act
      const result =
        await service.retrieveAndUpsertAccountEnquiriesForProgram(programId);

      // Assert
      expect(result).toBe(mockRegistrations.length);
      expect(
        commercialBankEthiopiaAccountEnquiriesScopedRepo.save,
      ).toHaveBeenCalledTimes(mockRegistrations.length);
    });

    it('should handle API errors gracefully and continue processing remaining registrations', async () => {
      // Arrange
      const apiError = new Error('API connection error');
      commercialBankEthiopiaApiService.getValidationStatus
        .mockRejectedValueOnce(apiError) // First registration fails
        .mockResolvedValueOnce(mockSuccessfulValidationResult); // Second registration succeeds

      commercialBankEthiopiaAccountEnquiriesScopedRepo.findOne.mockResolvedValue(
        null,
      );
      commercialBankEthiopiaAccountEnquiriesScopedRepo.save.mockResolvedValue([
        {} as CommercialBankEthiopiaAccountEnquiriesEntity,
      ]);

      // Act
      const result =
        await service.retrieveAndUpsertAccountEnquiriesForProgram(programId);

      // Assert
      expect(result).toBe(mockRegistrations.length);
      // Verify that only the second registration was saved (first one errored)
      expect(
        commercialBankEthiopiaAccountEnquiriesScopedRepo.save,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
