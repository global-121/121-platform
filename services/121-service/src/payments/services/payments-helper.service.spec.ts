import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

describe('PaymentsHelperService', () => {
  let service: PaymentsHelperService;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        TransactionViewScopedRepository,
        RegistrationsPaginationService,
        RegistrationsBulkService,
        PaymentsHelperService,
      ],
    }).compile();
    // programFspConfigurationRepository = {
    //   findOne: jest.fn(),
    // } as unknown as ProgramFspConfigurationRepository;

    // transactionViewScopedRepository = {
    //   findOne: jest.fn(),
    // } as unknown as TransactionViewScopedRepository;

    // registrationsPaginationService = module.get;

    service = module.get(PaymentsHelperService);
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
  });

  it('should throw if a configuration is missing', async () => {
    (
      programFspConfigurationRepository.findOne as jest.Mock
    ).mockResolvedValueOnce(null);
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).rejects.toThrow(HttpException);
  });

  it('should throw if the configuration is not fully configured', async () => {
    (
      programFspConfigurationRepository.findOne as jest.Mock
    ).mockResolvedValueOnce({
      fspName: 'TestFsp',
      state: FspConfigurationStates.configurationPending,
    });
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).rejects.toThrow(HttpException);
  });

  it('should not throw if the configuration is configured', async () => {
    (
      programFspConfigurationRepository.findOne as jest.Mock
    ).mockResolvedValueOnce({
      fspName: 'TestFsp',
      state: FspConfigurationStates.configured,
    });
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).resolves.toBeUndefined();
  });
});
