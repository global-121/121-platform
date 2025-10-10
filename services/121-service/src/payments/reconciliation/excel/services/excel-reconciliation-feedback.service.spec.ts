import { Test, TestingModule } from '@nestjs/testing';

import { ExcelReconciliationFeedbackService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-feedback.service';
import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';

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
            referenceId: '123',
            status: TransactionStatusEnum.success,
            value: 'A',
          },
          {
            referenceId: '456',
            status: TransactionStatusEnum.error,
            value: 'B',
          },
        ],
      );
      mockExcelReconciliationValidationService.getMatchColumnsValuesThatAreNotFound.mockReturnValue(
        [],
      );

      const csvContents = [{ matchCol: 'A' }, { matchCol: 'B' }];

      const result = await service.createFeedbackDto({
        programId: 1,
        paymentId: 2,
        matchColumn: 'matchCol',
        csvContents,
      });

      expect(result.importResult).toEqual([
        {
          matchCol: 'A',
          importStatus: ImportStatus.paymentSuccess,
          referenceId: '123',
        },
        {
          matchCol: 'B',
          importStatus: ImportStatus.paymentFailed,
          referenceId: '456',
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
            referenceId: '123',
            status: TransactionStatusEnum.success,
            value: 'A',
          },
        ],
      );
      mockExcelReconciliationValidationService.getMatchColumnsValuesThatAreNotFound.mockReturnValue(
        ['B'],
      );

      const csvContents = [{ matchCol: 'A' }, { matchCol: 'B' }];

      const result = await service.createFeedbackDto({
        programId: 1,
        paymentId: 2,
        matchColumn: 'matchCol',
        csvContents,
      });

      expect(result.importResult).toEqual([
        {
          matchCol: 'A',
          importStatus: ImportStatus.paymentSuccess,
          referenceId: '123',
        },
        {
          matchCol: 'B',
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
