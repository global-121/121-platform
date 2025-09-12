import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { AdditionalActionType } from '@121-service/src/actions/action.entity';
import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelReconciliationService } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';

describe('ExcelReconciliationService', () => {
  let service: ExcelReconciliationService;
  let paymentsProgressHelperService: jest.Mocked<PaymentsProgressHelperService>;
  let programRepository: jest.Mocked<Repository<ProgramEntity>>;
  let actionsService: jest.Mocked<ActionsService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let excelService: jest.Mocked<ExcelService>;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let fileImportService: jest.Mocked<FileImportService>;
  let registrationViewScopedRepository: jest.Mocked<RegistrationViewScopedRepository>;

  beforeEach(async () => {
    const mockPaymentsProgressHelperService = {
      isPaymentInProgress: jest.fn(),
    };

    const mockProgramRepository = {
      findOneOrFail: jest.fn(),
    };

    const mockActionsService = {
      saveAction: jest.fn(),
    };

    const mockTransactionsService = {
      storeReconciliationTransactionsBulk: jest.fn(),
      getLastTransactions: jest.fn(),
    };

    const mockExcelService = {
      getImportMatchColumn: jest.fn(),
      joinRegistrationsAndTransactions: jest.fn(),
    };

    const mockRegistrationsPaginationService = {
      getRegistrationViewsChunkedByPaginateQuery: jest.fn(),
    };

    const mockFileImportService = {
      validateCsv: jest.fn(),
    };

    const mockRegistrationViewScopedRepository = {
      getQueryBuilderForFspInstructions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelReconciliationService,
        {
          provide: PaymentsProgressHelperService,
          useValue: mockPaymentsProgressHelperService,
        },
        {
          provide: getRepositoryToken(ProgramEntity),
          useValue: mockProgramRepository,
        },
        {
          provide: ActionsService,
          useValue: mockActionsService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: ExcelService,
          useValue: mockExcelService,
        },
        {
          provide: RegistrationsPaginationService,
          useValue: mockRegistrationsPaginationService,
        },
        {
          provide: FileImportService,
          useValue: mockFileImportService,
        },
        {
          provide: RegistrationViewScopedRepository,
          useValue: mockRegistrationViewScopedRepository,
        },
      ],
    }).compile();

    service = module.get<ExcelReconciliationService>(
      ExcelReconciliationService,
    );
    paymentsProgressHelperService = module.get(PaymentsProgressHelperService);
    programRepository = module.get(getRepositoryToken(ProgramEntity));
    actionsService = module.get(ActionsService);
    transactionsService = module.get(TransactionsService);
    excelService = module.get(ExcelService);
    registrationsPaginationService = module.get(RegistrationsPaginationService);
    fileImportService = module.get(FileImportService);
    registrationViewScopedRepository = module.get(
      RegistrationViewScopedRepository,
    );
  });

  describe('upsertFspReconciliationData', () => {
    const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
    const programId = 1;
    const paymentId = 2;
    const userId = 3;

    it('should throw HttpException when payment is in progress', async () => {
      paymentsProgressHelperService.isPaymentInProgress.mockResolvedValue(true);

      await expect(
        service.upsertFspReconciliationData(
          mockFile,
          programId,
          paymentId,
          userId,
        ),
      ).rejects.toThrow(
        new HttpException(
          'Cannot import FSP reconciliation data while payment is in progress',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(
        paymentsProgressHelperService.isPaymentInProgress,
      ).toHaveBeenCalledWith(programId);
      expect(programRepository.findOneOrFail).not.toHaveBeenCalled();
      expect(fileImportService.validateCsv).not.toHaveBeenCalled();
      expect(
        transactionsService.storeReconciliationTransactionsBulk,
      ).not.toHaveBeenCalled();
      expect(actionsService.saveAction).not.toHaveBeenCalled();
    });

    it('should proceed with reconciliation when payment is not in progress', async () => {
      paymentsProgressHelperService.isPaymentInProgress.mockResolvedValue(
        false,
      );
      programRepository.findOneOrFail.mockResolvedValue({
        id: programId,
        programFspConfigurations: [
          {
            id: 1,
            fspName: Fsps.excel,
            name: 'Test FSP',
          },
        ],
      } as any);
      fileImportService.validateCsv.mockResolvedValue([]);
      excelService.getImportMatchColumn.mockResolvedValue('phoneNumber');
      registrationViewScopedRepository.getQueryBuilderForFspInstructions.mockReturnValue(
        {} as any,
      );
      registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery.mockResolvedValue(
        [],
      );
      transactionsService.getLastTransactions.mockResolvedValue([]);

      const result = await service.upsertFspReconciliationData(
        mockFile,
        programId,
        paymentId,
        userId,
      );

      expect(
        paymentsProgressHelperService.isPaymentInProgress,
      ).toHaveBeenCalledWith(programId);
      expect(programRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: Equal(programId) },
        relations: ['programFspConfigurations'],
      });
      expect(fileImportService.validateCsv).toHaveBeenCalledWith(
        mockFile,
        10000,
      );
      expect(actionsService.saveAction).toHaveBeenCalledWith(
        userId,
        programId,
        AdditionalActionType.importFspReconciliation,
      );
      expect(result).toHaveProperty('importResult');
      expect(result).toHaveProperty('aggregateImportResult');
    });
  });
});
