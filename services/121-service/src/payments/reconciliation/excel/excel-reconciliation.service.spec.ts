import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActionsService } from '@121-service/src/actions/actions.service';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { ExcelService } from '@121-service/src/payments/fsp-integration/excel/excel.service';
import { ExcelReconciliationService } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.service';
import { PaymentsProgressHelperService } from '@121-service/src/payments/services/payments-progress.helper.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
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
    mockPaymentsProgressHelperService.isPaymentInProgress.mockResolvedValue(
      false,
    );

    const mockProgramRepository = {
      findOne: jest.fn(),
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
      joinRegistrationsAndTransactions:
        ExcelService.prototype.joinRegistrationsAndTransactions,
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
    const fspName = 'Excel';
    const programFspConfigurationId = 4;
    const programFspConfigurationLabel = { en: 'Excel Payment Instructions' };
    const programFspConfigurationName = 'Excel';

    const registrations = [
      {
        phoneNumber: '14155235551',
        referenceId: '44e62864557597e0d',
        id: 2,
      },
      {
        phoneNumber: '14155235552',
        referenceId: 'asdf234f4gg4ag64545',
        id: 4,
      },
      {
        phoneNumber: '14155235553',
        referenceId: 'asdf234f4gg4ag64547',
        id: 6,
      },
    ];

    const generateViewEntity = ({ id, referenceId, phoneNumber }) => {
      const registration = new RegistrationViewEntity();
      registration.id = id;
      registration.referenceId = referenceId;
      registration.phoneNumber = phoneNumber;
      // programId?
      return registration;
    };

    // What `registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery` returns
    const generateViewEntities = (registrations) =>
      registrations.map(generateViewEntity);

    // What `transactionsService.getLastTransactions` returns
    const generateTransactions = (registrations) => {
      return registrations.map(({ referenceId }) => {
        return {
          paymentDate: new Date(),
          updated: new Date(),
          paymentId,
          referenceId,
          status: 'waiting',
          amount: 17.5,
          errorMessage: null,
          customData: {},
          fspName,
          programFspConfigurationId,
          programFspConfigurationLabel,
          programFspConfigurationName,
        };
      });
    };

    // Happy path
    it('should correctly do process reconciliation', async () => {
      const program = new ProgramEntity();
      program.id = programId;
      const programFspConfig = new ProgramFspConfigurationEntity();
      programFspConfig.fspName = Fsps.excel;
      programFspConfig.id = 1;
      programFspConfig.name = 'Test FSP';
      program.programFspConfigurations = [programFspConfig];

      programRepository.findOne.mockResolvedValue({
        id: programId,
        programFspConfigurations: program.programFspConfigurations,
      } as any);
      fileImportService.validateCsv.mockResolvedValue([
        { phoneNumber: '14155235557', status: 'success' },
        { phoneNumber: '14155235551', status: 'error' },
      ]);
      excelService.getImportMatchColumn.mockResolvedValue('phoneNumber');
      // No need to mock a value here as long as it doesn't fail.
      registrationViewScopedRepository.getQueryBuilderForFspInstructions.mockReturnValue(
        {} as any,
      );
      // Should return RegistrationViewEntities
      registrationsPaginationService.getRegistrationViewsChunkedByPaginateQuery.mockResolvedValue(
        generateViewEntities(registrations),
      );
      transactionsService.getLastTransactions.mockResolvedValue(
        generateTransactions(registrations),
      );

      const result = await service.upsertFspReconciliationData(
        mockFile,
        programId,
        paymentId,
        userId,
      );

      expect(result).toHaveProperty('importResult');
      expect(result).toHaveProperty('aggregateImportResult');
    });

    it('should throw when program does not exist', async () => {
      // Arrange
      programRepository.findOne.mockResolvedValue(undefined);

      const nonExistentProgramId = 999;
      // Act & Assert
      await expect(
        service.upsertFspReconciliationData(
          mockFile,
          nonExistentProgramId,
          paymentId,
          userId,
        ),
      ).rejects.toThrow(`No program with id ${nonExistentProgramId} found`); // Literally an empty error message.
      expect(
        paymentsProgressHelperService.isPaymentInProgress,
      ).not.toHaveBeenCalled();
    });

    it('should throw when payment is in progress', async () => {
      programRepository.findOne.mockResolvedValue(true);
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
        transactionsService.storeReconciliationTransactionsBulk,
      ).not.toHaveBeenCalled();
      expect(actionsService.saveAction).not.toHaveBeenCalled();
    });

    it('should throw when no FSP configurations are found', async () => {
      const program = new ProgramEntity();
      program.id = programId;
      program.programFspConfigurations = [];

      programRepository.findOne.mockResolvedValue({
        id: programId,
        programFspConfigurations: [],
      } as any);

      await expect(
        service.upsertFspReconciliationData(
          mockFile,
          programId,
          paymentId,
          userId,
        ),
      ).rejects.toThrow(
        new HttpException(
          'Other reconciliation FSPs than `Excel` are currently not supported.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
