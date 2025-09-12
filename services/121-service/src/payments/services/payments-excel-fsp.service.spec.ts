import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { PaymentsExcelFspService } from '@121-service/src/payments/services/payments-excel-fsp.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

describe('PaymentsExcelFspService', () => {
  let service: PaymentsExcelFspService;
  let paymentsProgressHelperService: jest.Mocked<PaymentsProgressHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
  let actionsService: jest.Mocked<ActionsService>;

  beforeEach(async () => {
    const mockPaymentsProgressHelperService = {
      isPaymentInProgress: jest.fn(),
    };

    const mockTransactionsService = {
      getLastTransactions: jest.fn(),
    };

    const mockProgramFspConfigurationRepository = {
      find: jest.fn(),
    };

    const mockExcelService = {
      getFspInstructions: jest.fn(),
    };

    const mockActionsService = {
      saveAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsExcelFspService,
        {
          provide: PaymentsProgressHelperService,
          useValue: mockPaymentsProgressHelperService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: mockProgramFspConfigurationRepository,
        },
        {
          provide: ExcelService,
          useValue: mockExcelService,
        },
        {
          provide: ActionsService,
          useValue: mockActionsService,
        },
      ],
    }).compile();

    service = module.get<PaymentsExcelFspService>(PaymentsExcelFspService);
    paymentsProgressHelperService = module.get(PaymentsProgressHelperService);
    transactionsService = module.get(TransactionsService);
    programFspConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
    actionsService = module.get(ActionsService);
  });

  describe('getFspInstructions', () => {
    const programId = 1;
    const paymentId = 2;
    const userId = 3;

    it('should throw HttpException when payment is in progress', async () => {
      paymentsProgressHelperService.isPaymentInProgress.mockResolvedValue(true);

      await expect(
        service.getFspInstructions(programId, paymentId, userId),
      ).rejects.toThrow(
        new HttpException(
          'Cannot export FSP instructions while payment is in progress',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(
        paymentsProgressHelperService.isPaymentInProgress,
      ).toHaveBeenCalledWith(programId);
      expect(transactionsService.getLastTransactions).not.toHaveBeenCalled();
      expect(programFspConfigurationRepository.find).not.toHaveBeenCalled();
      expect(actionsService.saveAction).not.toHaveBeenCalled();
    });

    it('should proceed with FSP instructions when payment is not in progress', async () => {
      paymentsProgressHelperService.isPaymentInProgress.mockResolvedValue(
        false,
      );
      transactionsService.getLastTransactions.mockResolvedValue([]);
      programFspConfigurationRepository.find.mockResolvedValue([]);

      await expect(
        service.getFspInstructions(programId, paymentId, userId),
      ).rejects.toThrow(
        new HttpException(
          'No transactions found for this payment with FSPs that require to download payment instructions.',
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(
        paymentsProgressHelperService.isPaymentInProgress,
      ).toHaveBeenCalledWith(programId);
      expect(transactionsService.getLastTransactions).toHaveBeenCalledWith({
        programId,
        paymentId,
      });
      expect(programFspConfigurationRepository.find).toHaveBeenCalled();
    });
  });
});
