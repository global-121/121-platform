import { TestBed } from '@automock/jest';

import { AlFouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { AlFouadReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/al-fouad/al-fouad-reconciliation.service';
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

describe('AlFouadReconciliationService', () => {
  let alFouadReconciliationService: AlFouadReconciliationService;
  let alFouadService: jest.Mocked<AlFouadService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;

  const transactionId = 42;
  const successStatus = {
    newTransactionStatus: TransactionStatusEnum.success,
    errorMessage: undefined,
  };

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      AlFouadReconciliationService,
    ).compile();

    alFouadReconciliationService = unit;
    alFouadService = unitRef.get(AlFouadService);
    transactionsService = unitRef.get(TransactionsService);
    transactionRepository = unitRef.get(TransactionRepository);
    transactionEventsScopedRepository = unitRef.get(
      TransactionEventsScopedRepository,
    );

    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([
      transactionId,
    ]);
    transactionRepository.getReferenceIdByTransactionIdOrThrow.mockResolvedValue(
      'registration-reference-id',
    );
    alFouadService.generateReferenceNumber.mockResolvedValue(
      'recomputed-reference-number',
    );
    transactionEventsScopedRepository.findLatestEventByTransactionId.mockResolvedValue(
      { programFspConfigurationId: 1 } as any,
    );
    alFouadService.getAlFouadFspConfig.mockResolvedValue({
      authIdentity: {} as AlFouadAuthIdentity,
    } as any);
    alFouadService.getTransactionStateByRef.mockResolvedValue(
      AlFouadApiTransactionState.paid,
    );
    alFouadService.mapAlFouadStateToFinalTransactionStatus.mockReturnValue(
      successStatus,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not reconcile anything when there are no waiting transactions', async () => {
    // Arrange
    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([]);

    // Act
    const count = await alFouadReconciliationService.doAlFouadReconciliation();

    // Assert
    expect(count).toBe(0);
  });

  it('should save progress when Al Fouad reports a final state', async () => {
    // Act
    await alFouadReconciliationService.doAlFouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId,
      description: TransactionEventDescription.alFouadReconciliationProcessed,
      ...successStatus,
    });
  });

  it('should keep the transaction on waiting when Al Fouad reports a non-final state', async () => {
    // Arrange
    alFouadService.mapAlFouadStateToFinalTransactionStatus.mockReturnValue(
      undefined,
    );

    // Act
    await alFouadReconciliationService.doAlFouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).not.toHaveBeenCalled();
  });

  it('should continue with the next transaction when a transaction is not found at Al Fouad', async () => {
    // Arrange
    const otherTransactionId = 43;
    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([
      transactionId,
      otherTransactionId,
    ]);
    alFouadService.getTransactionStateByRef
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(AlFouadApiTransactionState.paid);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    await alFouadReconciliationService.doAlFouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledTimes(1);
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId: otherTransactionId,
      description: TransactionEventDescription.alFouadReconciliationProcessed,
      ...successStatus,
    });
  });

  it('should rethrow unexpected errors and abort the batch', async () => {
    // Arrange: a second waiting transaction makes the abort observable
    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([
      transactionId,
      43,
    ]);
    const unexpectedError = new Error('database unavailable');
    transactionRepository.getReferenceIdByTransactionIdOrThrow.mockRejectedValue(
      unexpectedError,
    );

    // Act & Assert
    await expect(
      alFouadReconciliationService.doAlFouadReconciliation(),
    ).rejects.toBe(unexpectedError);
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).not.toHaveBeenCalled();
  });
});
