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
  const successStatus = {
    newTransactionStatus: TransactionStatusEnum.success,
    errorMessage: undefined,
  };

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

    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([
      transactionId,
    ]);
    transactionRepository.getReferenceIdByTransactionIdOrThrow.mockResolvedValue(
      'registration-reference-id',
    );
    alfouadService.generateReferenceNumber.mockResolvedValue(
      'recomputed-reference-number',
    );
    transactionEventsScopedRepository.findLatestEventByTransactionId.mockResolvedValue(
      { programFspConfigurationId: 1 } as any,
    );
    alfouadService.getAlfouadFspConfig.mockResolvedValue({
      authIdentity: {} as AlfouadAuthIdentity,
    } as any);
    alfouadService.getTransactionStateByRef.mockResolvedValue(
      AlfouadApiTransactionState.paid,
    );
    alfouadService.mapAlfouadStateToFinalTransactionStatus.mockReturnValue(
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
    const count = await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(count).toBe(0);
  });

  it('should save progress when Al Fouad reports a final state', async () => {
    // Act
    await alfouadReconciliationService.doAlfouadReconciliation();

    // Assert
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).toHaveBeenCalledWith({
      transactionId,
      description: TransactionEventDescription.alfouadReconciliationProcessed,
      ...successStatus,
    });
  });

  it('should keep the transaction on waiting when Al Fouad reports a non-final state', async () => {
    // Arrange
    alfouadService.mapAlfouadStateToFinalTransactionStatus.mockReturnValue(
      undefined,
    );

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
    transactionRepository.getWaitingTransactionIdsByFsp.mockResolvedValue([
      transactionId,
      otherTransactionId,
    ]);
    alfouadService.getTransactionStateByRef
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(AlfouadApiTransactionState.paid);
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
      alfouadReconciliationService.doAlfouadReconciliation(),
    ).rejects.toBe(unexpectedError);
    expect(
      transactionsService.saveProgressFromExternalSource,
    ).not.toHaveBeenCalled();
  });
});
