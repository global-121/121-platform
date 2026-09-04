import { TestBed } from '@automock/jest';

import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.interface';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { AlfouadReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/alfouad/alfouad-reconciliation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

describe('AlfouadReconciliationService', () => {
  let alfouadReconciliationService: AlfouadReconciliationService;
  let alfouadService: jest.Mocked<AlfouadService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;

  const transactionId = 42;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      AlfouadReconciliationService,
    ).compile();

    alfouadReconciliationService = unit;
    alfouadService = unitRef.get(AlfouadService);
    transactionsService = unitRef.get(TransactionsService);
    transactionRepository = unitRef.get(TransactionRepository);
    transactionEventsScopedRepository = unitRef.get(
      TransactionEventsScopedRepository,
    );

    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([transactionId]);
    (
      transactionRepository.getReferenceIdByTransactionIdOrThrow as jest.Mock
    ).mockResolvedValue('registration-reference-id');
    (alfouadService.generateReferenceNumber as jest.Mock).mockResolvedValue(
      'recomputed-reference-number',
    );
    (
      transactionEventsScopedRepository.findLatestEventByTransactionId as jest.Mock
    ).mockResolvedValue({ programFspConfigurationId: 1 });
    (alfouadService.getAlfouadFspConfig as jest.Mock).mockResolvedValue({
      authIdentity: {} as AlfouadAuthIdentity,
    });
    (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
      AlfouadApiTransactionState.paid,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not reconcile anything when there are no waiting transactions', async () => {
    // Arrange
    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([]);

    // Act
    const count = await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(count).toBe(0);
  });

  it('should save progress with status success when Al Fouad reports a final paid state', async () => {
    // Arrange
    (
      alfouadService.mapAlfouadStateToTransactionStatus as jest.Mock
    ).mockReturnValue(TransactionStatusEnum.success);

    // Act
    await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId,
      description: TransactionEventDescription.alfouadReconciliationProcessed,
      newTransactionStatus: TransactionStatusEnum.success,
      errorMessage: undefined,
    });
  });

  it('should save progress with status error and a cancellation message when Al Fouad reports a canceled state', async () => {
    // Arrange
    (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
      AlfouadApiTransactionState.canceled,
    );
    (
      alfouadService.mapAlfouadStateToTransactionStatus as jest.Mock
    ).mockReturnValue(TransactionStatusEnum.error);

    // Act
    await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId,
      description: TransactionEventDescription.alfouadReconciliationProcessed,
      newTransactionStatus: TransactionStatusEnum.error,
      errorMessage: 'The transaction was canceled at Al Fouad.',
    });
  });

  it('should keep the transaction on waiting when Al Fouad reports a non-final state', async () => {
    // Arrange
    (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
      AlfouadApiTransactionState.approved,
    );
    (
      alfouadService.mapAlfouadStateToTransactionStatus as jest.Mock
    ).mockReturnValue(TransactionStatusEnum.waiting);

    // Act
    await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).not.toHaveBeenCalled();
  });

  it('should continue with the next transaction when a transaction is not found at Al Fouad', async () => {
    // Arrange
    const otherTransactionId = 43;
    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([transactionId, otherTransactionId]);
    (alfouadService.getTransactionStateByRef as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(AlfouadApiTransactionState.paid);
    (
      alfouadService.mapAlfouadStateToTransactionStatus as jest.Mock
    ).mockReturnValue(TransactionStatusEnum.success);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId: otherTransactionId,
      description: TransactionEventDescription.alfouadReconciliationProcessed,
      newTransactionStatus: TransactionStatusEnum.success,
      errorMessage: undefined,
    });
  });

  it('should rethrow unexpected errors and abort the batch', async () => {
    // Arrange: a second waiting transaction makes the abort observable
    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([transactionId, 43]);
    const unexpectedError = new Error('database unavailable');
    (
      transactionRepository.getReferenceIdByTransactionIdOrThrow as jest.Mock
    ).mockRejectedValue(unexpectedError);

    // Act & Assert
    await expect(
      alfouadReconciliationService.doAlfouadReconciliation(),
    ).rejects.toBe(unexpectedError);
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).not.toHaveBeenCalled();
  });
});
