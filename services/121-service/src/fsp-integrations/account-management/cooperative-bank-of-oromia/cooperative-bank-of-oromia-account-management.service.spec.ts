import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/cooperative-bank-of-oromia-account-management.service';
import { CooperativeBankOfOromiaAccountValidationScopedRepository } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia/repositories/cooperative-bank-of-oromia-account-validation.scoped.repository';
import { CooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

describe('CooperativeBankOfOromiaAccountManagementService', () => {
  let service: CooperativeBankOfOromiaAccountManagementService;
  let registrationViewScopedRepository: jest.Mocked<RegistrationViewScopedRepository>;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let cooperativeBankOfOromiaService: jest.Mocked<CooperativeBankOfOromiaService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooperativeBankOfOromiaAccountManagementService,
        {
          provide: CooperativeBankOfOromiaAccountValidationScopedRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            getAccountValidationReportRecords: jest.fn(),
          },
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: {
            getQueryBuilderForAccountValidation: jest.fn().mockReturnValue({}),
          },
        },
        {
          provide: RegistrationsPaginationService,
          useValue: {
            getRegistrationViewsNoLimit: jest.fn(),
          },
        },
        {
          provide: CooperativeBankOfOromiaService,
          useValue: {
            getAccountInformation: jest.fn(),
          },
        },
        {
          provide: ProgramRepository,
          useValue: {
            getAllProgramIdsWithFsp: jest.fn(),
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            isFspConfiguredForProgram: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CooperativeBankOfOromiaAccountManagementService>(
      CooperativeBankOfOromiaAccountManagementService,
    );
    registrationViewScopedRepository = module.get(
      RegistrationViewScopedRepository,
    );
    registrationsPaginationService = module.get(
      RegistrationsPaginationService,
    );
    cooperativeBankOfOromiaService = module.get(
      CooperativeBankOfOromiaService,
    );
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
  });

  describe('retrieveAndUpsertAccountInformationForProgram', () => {
    const programId = 1;

    it('should return 0 early if Cooperative Bank of Oromia is not fully configured for the program', async () => {
      // Arrange
      programFspConfigurationRepository.isFspConfiguredForProgram.mockResolvedValue(
        false,
      );

      // Act
      const result =
        await service.retrieveAndUpsertAccountInformationForProgram({
          programId,
        });

      // Assert
      expect(result).toBe(0);
      expect(
        registrationViewScopedRepository.getQueryBuilderForAccountValidation,
      ).not.toHaveBeenCalled();
      expect(
        registrationsPaginationService.getRegistrationViewsNoLimit,
      ).not.toHaveBeenCalled();
      expect(
        cooperativeBankOfOromiaService.getAccountInformation,
      ).not.toHaveBeenCalled();
    });
  });
});
