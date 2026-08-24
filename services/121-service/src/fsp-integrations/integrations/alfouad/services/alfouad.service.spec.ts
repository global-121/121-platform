import { Test, TestingModule } from '@nestjs/testing';

import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

const requestIdentity: AlfouadRequestIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
  senderFullName: 'Red Crescent',
  senderPhoneNumber: '0900000000',
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
  requestIdentity,
};

describe('AlfouadService', () => {
  let service: AlfouadService;
  let createTransaction: jest.Mock;
  let getTransactionStateByRef: jest.Mock;

  beforeEach(async () => {
    createTransaction = jest.fn();
    getTransactionStateByRef = jest.fn();

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
});
