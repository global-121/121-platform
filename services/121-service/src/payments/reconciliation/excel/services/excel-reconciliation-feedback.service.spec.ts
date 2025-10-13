import { Test, TestingModule } from '@nestjs/testing';

import { ExcelReconciliationFeedbackService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-feedback.service';
import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';

const referenceId1 = '123';
const referenceId2 = '456';
const matchColumnA = 'A';
const matchColumnB = 'B';

const mockRegistrationViewScopedRepository = {
  getReferenceIdsAndStatusesByPaymentForRegistrationData: jest.fn(),
};
const mockProgramRegistrationAttributeRepository = {
  getIdByNameAndProgramId: jest.fn(),
};
const mockExcelReconciliationValidationService = {
  getMatchColumnsValuesThatAreNotFound: jest.fn(),
};

describe('ExcelReconciliationFeedbackService', () => {
  let service: ExcelReconciliationFeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelReconciliationFeedbackService,
        {
          provide: RegistrationViewScopedRepository,
          useValue: mockRegistrationViewScopedRepository,
        },
        {
          provide: ProgramRegistrationAttributeRepository,
          useValue: mockProgramRegistrationAttributeRepository,
        },
        {
          provide: ExcelReconciliationValidationService,
          useValue: mockExcelReconciliationValidationService,
        },
      ],
    }).compile();

    service = module.get<ExcelReconciliationFeedbackService>(
      ExcelReconciliationFeedbackService,
    );
    jest.clearAllMocks();
  });

  describe('createFeedbackDto', () => {
    it('should return feedback with paymentSuccess and paymentFailed', async () => {
      mockProgramRegistrationAttributeRepository.getIdByNameAndProgramId.mockResolvedValue(
        '1',
      );
      mockRegistrationViewScopedRepository.getReferenceIdsAndStatusesByPaymentForRegistrationData.mockResolvedValue(
        [
          {
            referenceId: referenceId1,
            status: TransactionStatusEnum.success,
            value: matchColumnA,
          },
          {
            referenceId: referenceId2,
            status: TransactionStatusEnum.error,
            value: matchColumnB,
          },
        ],
      );
      mockExcelReconciliationValidationService.getMatchColumnsValuesThatAreNotFound.mockReturnValue(
        [],
      );

      const csvContents = [
        { matchCol: matchColumnA },
        { matchCol: matchColumnB },
      ];

      const result = await service.createFeedbackDto({
        programId: 1,
        paymentId: 2,
        matchColumn: 'matchCol',
        csvContents,
      });

      expect(result.importResult).toEqual([
        {
          matchCol: matchColumnA,
          importStatus: ImportStatus.paymentSuccess,
          referenceId: referenceId1,
        },
        {
          matchCol: matchColumnB,
          importStatus: ImportStatus.paymentFailed,
          referenceId: referenceId2,
        },
      ]);
      expect(result.aggregateImportResult).toEqual({
        countPaymentSuccess: 1,
        countPaymentFailed: 1,
        countNotFound: 0,
      });
    });

    it('should add notFound feedback for missing values', async () => {
      mockProgramRegistrationAttributeRepository.getIdByNameAndProgramId.mockResolvedValue(
        '1',
      );
      mockRegistrationViewScopedRepository.getReferenceIdsAndStatusesByPaymentForRegistrationData.mockResolvedValue(
        [
          {
            referenceId: referenceId1,
            status: TransactionStatusEnum.success,
            value: matchColumnA,
          },
        ],
      );
      mockExcelReconciliationValidationService.getMatchColumnsValuesThatAreNotFound.mockReturnValue(
        [matchColumnB],
      );

      const csvContents = [
        { matchCol: matchColumnA },
        { matchCol: matchColumnB },
      ];

      const result = await service.createFeedbackDto({
        programId: 1,
        paymentId: 2,
        matchColumn: 'matchCol',
        csvContents,
      });

      expect(result.importResult).toEqual([
        {
          matchCol: matchColumnA,
          importStatus: ImportStatus.paymentSuccess,
          referenceId: referenceId1,
        },
        {
          matchCol: matchColumnB,
          importStatus: ImportStatus.notFound,
          referenceId: null,
        },
      ]);
      expect(result.aggregateImportResult).toEqual({
        countPaymentSuccess: 1,
        countPaymentFailed: 0,
        countNotFound: 1,
      });
    });
  });
});
