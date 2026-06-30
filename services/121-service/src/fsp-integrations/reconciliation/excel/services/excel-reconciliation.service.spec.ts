import { HttpException, HttpStatus } from '@nestjs/common';

import { ExcelReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/excel/services/excel-reconciliation.service';

describe('ExcelReconciliationService', () => {
  let service: ExcelReconciliationService;
  let paymentsProgressService: { isPaymentInProgress: jest.Mock };

  beforeEach(() => {
    paymentsProgressService = {
      isPaymentInProgress: jest.fn(),
    } as any;

    service = new ExcelReconciliationService(
      /* excelService */ {} as any,
      /* fileImportService */ {} as any,
      /* registrationViewScopedRepository */ {} as any,
      paymentsProgressService as any,
      /* programRegistrationAttributeRepository */ {} as any,
      /* transactionsService */ {} as any,
      /* transactionEventsScopedRepository */ {} as any,
      /* excelReconciliationValidationService */ {} as any,
      /* excelReconciliationFeedbackService */ {} as any,
    );
  });

  it('should throw if payment is in progress', async () => {
    paymentsProgressService.isPaymentInProgress.mockResolvedValue(true);

    await expect(
      service.upsertFspReconciliationData({
        file: {} as any,
        programId: 1,
        paymentId: 1,
        userId: 1,
      }),
    ).rejects.toThrow(
      new HttpException(
        'Cannot import FSP reconciliation data while payment is in progress',
        HttpStatus.BAD_REQUEST,
      ),
    );
  });

  // NOTE: other scenarios within upsertFspReconciliationData are covered in API-test do-payment-fsp-excel-reconciliation-validation.test.ts
});
