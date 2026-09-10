import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { AlFouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-error-code.enum';
import { AlFouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum';
import { AlFouadMockReferenceId } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-mock-reference-id.enum';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-create-transaction-params.interface';
import { AlFouadApiService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.service';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

jest.mock('@121-service/src/env', () => ({
  env: {
    AL_FOUAD_MODE: 'MOCK',
    UUID_NAMESPACE: '00000000-0000-5000-8000-000000000000',
  },
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

const authIdentity: AlFouadAuthIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

const createTransactionInput: AlFouadCreateTransactionParams = {
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

describe('AlFouadService', () => {
  let service: AlFouadService;
  let createTransaction: jest.Mock;
  let getTransactionStateByRef: jest.Mock;
  let countFailedTransactionAttempts: jest.Mock;

  beforeEach(async () => {
    createTransaction = jest.fn();
    getTransactionStateByRef = jest.fn();
    countFailedTransactionAttempts = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlFouadService,
        {
          provide: AlFouadApiService,
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

    service = module.get<AlFouadService>(AlFouadService);
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
        errorCode: AlFouadApiErrorCode.duplicateReferenceNumber,
      });
      getTransactionStateByRef.mockResolvedValue(
        AlFouadApiTransactionState.pendingApproval,
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
        errorCode: AlFouadApiErrorCode.duplicateReferenceNumber,
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
      (env as { AL_FOUAD_MODE: FspMode }).AL_FOUAD_MODE = FspMode.mock;
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
        referenceId: AlFouadMockReferenceId.stateApproved,
        transactionId: 1,
      });

      // Assert
      expect(result).toBe(AlFouadMockReferenceId.stateApproved);
    });

    it('should not pass a mock referenceId through when not in mock mode', async () => {
      // Arrange
      (env as { AL_FOUAD_MODE: FspMode }).AL_FOUAD_MODE = FspMode.external;
      countFailedTransactionAttempts.mockResolvedValue(0);

      // Act
      const result = await service.generateReferenceNumber({
        referenceId: AlFouadMockReferenceId.stateApproved,
        transactionId: 1,
      });

      // Assert
      expect(result).not.toBe(AlFouadMockReferenceId.stateApproved);
    });
  });

  describe('Mapping an Al Fouad state to a transaction status', () => {
    it('should map paid to success', () => {
      expect(
        service.mapAlFouadStateToTransactionStatus({
          alFouadState: AlFouadApiTransactionState.paid,
        }),
      ).toBe(TransactionStatusEnum.success);
    });
  
    it.each([
      AlFouadApiTransactionState.pendingApproval,
      AlFouadApiTransactionState.approved,
      AlFouadApiTransactionState.hold,
    ])('should map state %s to waiting', (alFouadState) => {
      expect(service.mapAlFouadStateToTransactionStatus({ alFouadState })).toBe(
        TransactionStatusEnum.waiting,
      );
    });
  
    it('should map canceled to error', () => {
      expect(
        service.mapAlFouadStateToTransactionStatus({
          alFouadState: AlFouadApiTransactionState.canceled,
        }),
      ).toBe(TransactionStatusEnum.error);
    });
  });

  describe('Mapping an Al Fouad state to a final transaction status', () => {
    it('should map a paid state to success', () => {
      expect(
        service.mapAlFouadStateToFinalTransactionStatus({
          alFouadState: AlFouadApiTransactionState.paid,
        }),
      ).toEqual({
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });

    it.each([
      AlFouadApiTransactionState.pendingApproval,
      AlFouadApiTransactionState.approved,
      AlFouadApiTransactionState.hold,
    ])('should return undefined for the non-final state %s', (alFouadState) => {
      expect(
        service.mapAlFouadStateToFinalTransactionStatus({ alFouadState }),
      ).toBeUndefined();
    });

    it('should map a canceled state to error with a cancellation message', () => {
      expect(
        service.mapAlFouadStateToFinalTransactionStatus({
          alFouadState: AlFouadApiTransactionState.canceled,
        }),
      ).toEqual({
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'The transaction was canceled at Al Fouad.',
      });
    });
  });
});
