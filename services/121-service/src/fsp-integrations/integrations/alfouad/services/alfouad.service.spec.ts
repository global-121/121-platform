import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadMockReferenceId } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-mock-reference-id.enum';
import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.interface';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

jest.mock('@121-service/src/env', () => ({
  env: {
    ALFOUAD_MODE: 'MOCK',
    UUID_NAMESPACE: '00000000-0000-5000-8000-000000000000',
  },
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

const authIdentity: AlfouadAuthIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

const createTransactionInput: AlfouadCreateTransactionParams = {
  senderFullName: 'Test Sender',
  senderPhoneNumber: '0900000000',
  beneficiaryFullName: 'Test Beneficiary',
  beneficiaryPhoneNumber: '0911111111',
  referenceNumber: 'RC-TEST-1',
  countryCode: 'SY',
  cityCode: 'Damascus',
  deliveryCurrencyCode: 'SYP',
  deliveryAmount: 10000,
  authIdentity,
};

describe('AlfouadService', () => {
  let service: AlfouadService;
  let createTransaction: jest.Mock;
  let getTransactionStateByRef: jest.Mock;
  let countFailedTransactionAttempts: jest.Mock;

  beforeEach(async () => {
    createTransaction = jest.fn();
    getTransactionStateByRef = jest.fn();
    countFailedTransactionAttempts = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlfouadService,
        {
          provide: AlfouadApiService,
          useValue: {
            createTransaction,
            getTransactionStateByRef,
          },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {},
        },
        {
          provide: TransactionEventsScopedRepository,
          useValue: { countFailedTransactionAttempts },
        },
      ],
    }).compile();

    service = module.get<AlfouadService>(AlfouadService);
  });

  describe('Creating a transaction', () => {
    it('should resolve when the transaction succeeds', async () => {
      // Arrange
      createTransaction.mockResolvedValue({ state: '1', message: 'Success' });

      // Act
      await service.createTransaction(createTransactionInput);

      // Assert
      expect(createTransaction).toHaveBeenCalled();
      expect(getTransactionStateByRef).not.toHaveBeenCalled();
    });

    it('should recover on a duplicate (822) when the transaction exists', async () => {
      // Arrange
      createTransaction.mockResolvedValue({
        state: '0',
        message: 'duplicate Reference Number',
        errorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
      getTransactionStateByRef.mockResolvedValue(
        AlfouadApiTransactionState.pendingApproval,
      );

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).resolves.toBeUndefined();
      expect(getTransactionStateByRef).toHaveBeenCalled();
    });

    it('should throw on a duplicate (822) when the transaction cannot be found', async () => {
      // Arrange
      createTransaction.mockResolvedValue({
        state: '0',
        message: 'duplicate Reference Number',
        errorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
      getTransactionStateByRef.mockResolvedValue(undefined);

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).rejects.toThrow('was not found');
      await expect(act).rejects.toHaveProperty('errorCode', '822');
    });

    it('should rethrow errors that are not a duplicate (822)', async () => {
      // Arrange
      createTransaction.mockResolvedValue({
        state: '0',
        message: 'account limit',
        errorCode: '45',
      });

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).rejects.toThrow('account limit');
      expect(getTransactionStateByRef).not.toHaveBeenCalled();
    });
  });

  describe('Generating a reference number', () => {
    beforeEach(() => {
      (env as { ALFOUAD_MODE: FspMode }).ALFOUAD_MODE = FspMode.mock;
    });

    it('should compute the same reference for the same failed-attempt count', async () => {
      // Arrange
      countFailedTransactionAttempts.mockResolvedValue(0);

      // Act
      const first = await service.generateReferenceNumber({
        referenceId: 'ref-1',
        transactionId: 1,
      });
      const second = await service.generateReferenceNumber({
        referenceId: 'ref-1',
        transactionId: 1,
      });

      // Assert
      expect(first).toBe(second);
    });

    it('should compute a different reference after a failed attempt', async () => {
      // Arrange
      countFailedTransactionAttempts.mockResolvedValueOnce(0);
      countFailedTransactionAttempts.mockResolvedValueOnce(1);

      // Act
      const first = await service.generateReferenceNumber({
        referenceId: 'ref-1',
        transactionId: 1,
      });
      const second = await service.generateReferenceNumber({
        referenceId: 'ref-1',
        transactionId: 1,
      });

      // Assert
      expect(first).not.toBe(second);
    });

    it('should pass a mock referenceId through unchanged in mock mode', async () => {
      // Arrange
      countFailedTransactionAttempts.mockResolvedValue(0);

      // Act
      const result = await service.generateReferenceNumber({
        referenceId: AlfouadMockReferenceId.stateApproved,
        transactionId: 1,
      });

      // Assert
      expect(result).toBe(AlfouadMockReferenceId.stateApproved);
    });

    it('should not pass a mock referenceId through when not in mock mode', async () => {
      // Arrange
      (env as { ALFOUAD_MODE: FspMode }).ALFOUAD_MODE = FspMode.external;
      countFailedTransactionAttempts.mockResolvedValue(0);

      // Act
      const result = await service.generateReferenceNumber({
        referenceId: AlfouadMockReferenceId.stateApproved,
        transactionId: 1,
      });

      // Assert
      expect(result).not.toBe(AlfouadMockReferenceId.stateApproved);
    });
  });

  describe('Mapping an Al Fouad state to a transaction status', () => {
    it('should map paid to success', () => {
      expect(
        service.mapAlfouadStateToTransactionStatus({
          alfouadState: AlfouadApiTransactionState.paid,
        }),
      ).toBe(TransactionStatusEnum.success);
    });
  
    it.each([
      AlfouadApiTransactionState.pendingApproval,
      AlfouadApiTransactionState.approved,
      AlfouadApiTransactionState.hold,
    ])('should map state %s to waiting', (alfouadState) => {
      expect(service.mapAlfouadStateToTransactionStatus({ alfouadState })).toBe(
        TransactionStatusEnum.waiting,
      );
    });
  
    it('should map canceled to error', () => {
      expect(
        service.mapAlfouadStateToTransactionStatus({
          alfouadState: AlfouadApiTransactionState.canceled,
        }),
      ).toBe(TransactionStatusEnum.error);
    });
  });

  describe('Mapping an Al Fouad state to a final transaction status', () => {
    it('should map a paid state to success', () => {
      expect(
        service.mapAlfouadStateToFinalTransactionStatus({
          alfouadState: AlfouadApiTransactionState.paid,
        }),
      ).toEqual({
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });

    it.each([
      AlfouadApiTransactionState.pendingApproval,
      AlfouadApiTransactionState.approved,
      AlfouadApiTransactionState.hold,
    ])('should return undefined for the non-final state %s', (alfouadState) => {
      expect(
        service.mapAlfouadStateToFinalTransactionStatus({ alfouadState }),
      ).toBeUndefined();
    });

    it('should map a canceled state to error with a cancellation message', () => {
      expect(
        service.mapAlfouadStateToFinalTransactionStatus({
          alfouadState: AlfouadApiTransactionState.canceled,
        }),
      ).toEqual({
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'The transaction was canceled at Al Fouad.',
      });
    });
  });
});
