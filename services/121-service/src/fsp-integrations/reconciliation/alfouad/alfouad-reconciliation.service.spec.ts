import { TestBed } from '@automock/jest';

import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { AlfouadReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/alfouad/alfouad-reconciliation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

jest.mock('@121-service/src/env', () => ({
  env: {
    UUID_NAMESPACE: '1b671a64-40d5-491e-99b0-da01ff1f3341',
  },
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

const requestIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

describe('AlfouadReconciliationService', () => {
  let service: AlfouadReconciliationService;
  let alfouadService: jest.Mocked<AlfouadService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      AlfouadReconciliationService,
    ).compile();

    service = unit;
    alfouadService = unitRef.get(AlfouadService);
    transactionsService = unitRef.get(TransactionsService);
    transactionRepository = unitRef.get(TransactionRepository);
    transactionEventsScopedRepository = unitRef.get(
      TransactionEventsScopedRepository,
    );

    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([]);
    (
      transactionRepository.getReferenceIdByTransactionIdOrThrow as jest.Mock
    ).mockResolvedValue('registration-ref-id');
    (
      transactionEventsScopedRepository.countFailedTransactionAttempts as jest.Mock
    ).mockResolvedValue(0);
    (
      transactionEventsScopedRepository.findLatestEventByTransactionId as jest.Mock
    ).mockResolvedValue({ programFspConfigurationId: 1 });
    (alfouadService.getAlfouadFspConfig as jest.Mock).mockResolvedValue(
      requestIdentity,
    );
  });

  describe('doAlfouadReconciliation', () => {
    it('should return the number of selected waiting transactions', async () => {
      // Arrange
      (
        transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
      ).mockResolvedValue([42, 43]);
      (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
        AlfouadApiTransactionState.approved,
      );

      // Act
      const count = await service.doAlfouadReconciliation();

      // Assert
      expect(count).toBe(2);
    });

    it('should set the transaction to success when Al Fouad reports Paid', async () => {
      // Arrange
      (
        transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
      ).mockResolvedValue([42]);
      (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
        AlfouadApiTransactionState.paid,
      );

      // Act
      await service.doAlfouadReconciliation();

      // Assert
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description:
          TransactionEventDescription.alfouadReconciliationProcessed,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });

    it('should set the transaction to error with a cancel reason when Al Fouad reports Canceled', async () => {
      // Arrange
      (
        transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
      ).mockResolvedValue([42]);
      (alfouadService.getTransactionStateByRef as jest.Mock).mockResolvedValue(
        AlfouadApiTransactionState.canceled,
      );

      // Act
      await service.doAlfouadReconciliation();

      // Assert
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description:
          TransactionEventDescription.alfouadReconciliationProcessed,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'The transaction was canceled at Al Fouad.',
      });
    });

    it.each([
      AlfouadApiTransactionState.pendingApproval,
      AlfouadApiTransactionState.approved,
      AlfouadApiTransactionState.hold,
    ])(
      'should leave the transaction on waiting for state %s',
      async (state) => {
        // Arrange
        (
          transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
        ).mockResolvedValue([42]);
        (
          alfouadService.getTransactionStateByRef as jest.Mock
        ).mockResolvedValue(state);

        // Act
        await service.doAlfouadReconciliation();

        // Assert
        expect(
          transactionsService.saveProgressFromExternalSource,
        ).not.toHaveBeenCalled();
      },
    );

    it('should isolate a not-found transaction without halting the batch or updating status', async () => {
      // Arrange
      (
        transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
      ).mockResolvedValue([42, 43]);
      (alfouadService.getTransactionStateByRef as jest.Mock)
        .mockResolvedValueOnce(undefined) // 42: not found -> throws internally, caught
        .mockResolvedValueOnce(AlfouadApiTransactionState.paid); // 43: processed

      // Act
      const count = await service.doAlfouadReconciliation();

      // Assert
      expect(count).toBe(2);
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledTimes(1);
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 43,
        description:
          TransactionEventDescription.alfouadReconciliationProcessed,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });
  });
});
