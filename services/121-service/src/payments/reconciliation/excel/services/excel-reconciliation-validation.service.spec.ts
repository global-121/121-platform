import { HttpException } from '@nestjs/common';

import { ExcelReconciliationValidationService } from '@121-service/src/payments/reconciliation/excel/services/excel-reconciliation-validation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

describe('ExcelReconciliationValidationService - validateStatusColumn', () => {
  let service: ExcelReconciliationValidationService;

  beforeEach(() => {
    // All dependencies are unused for this method
    service = new ExcelReconciliationValidationService(
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should not throw if all statuses are valid', () => {
    const csvContents = [
      { status: TransactionStatusEnum.success },
      { status: TransactionStatusEnum.error },
    ];
    expect(() => service.validateStatusColumn(csvContents)).not.toThrow();
  });

  it('should throw if status column is missing', () => {
    const csvContents = [{ foo: 'bar' }];
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      HttpException,
    );
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      /status column is missing/,
    );
  });

  it('should throw if any status value is invalid', () => {
    const csvContents = [
      { status: TransactionStatusEnum.success },
      { status: 'not-a-status' },
    ];
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      HttpException,
    );
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      /Invalid status value/,
    );
  });

  it('should throw if status is empty string', () => {
    const csvContents = [{ status: '' }];
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      HttpException,
    );
  });

  it('should throw if csvContents is empty', () => {
    expect(() => service.validateStatusColumn([])).toThrow();
  });

  it('should throw if status is undefined', () => {
    const csvContents = [{ status: undefined }];
    expect(() => service.validateStatusColumn(csvContents)).toThrow(
      HttpException,
    );
  });

  it('should throw if errorMessage is present for a successful transaction', () => {
    const csvContents = [
      {
        status: TransactionStatusEnum.success,
        errorMessage: 'Should not be here',
      },
    ];
    expect(() => service.validateErrorMessageColumn(csvContents)).toThrow(
      HttpException,
    );
  });
});
