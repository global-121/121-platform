import { Test, TestingModule } from '@nestjs/testing';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

const requestIdentity: AlfouadRequestIdentity = {
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
          useValue: { createTransaction, getTransactionStateByRef },
        },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AlfouadService>(AlfouadService);
  });

  describe('createTransaction', () => {
    it('should resolve when the transaction succeeds', async () => {
      // Arrange
      createTransaction.mockResolvedValue({ State: '1', Message: 'Success' });

      // Act
      await service.createTransaction(createTransactionInput);

      // Assert
      expect(createTransaction).toHaveBeenCalled();
      expect(getTransactionStateByRef).not.toHaveBeenCalled();
    });

    it('should recover on a duplicate (822) when the transaction exists', async () => {
      // Arrange
      createTransaction.mockResolvedValue({
        State: '0',
        Message: 'duplicate Reference Number',
        ErrorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
      getTransactionStateByRef.mockResolvedValue(
        AlfouadApiTransactionStateEnum.pendingApproval,
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
        State: '0',
        Message: 'duplicate Reference Number',
        ErrorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
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
        State: '0',
        Message: 'account limit',
        ErrorCode: '45',
      });

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).rejects.toThrow('account limit');
      expect(getTransactionStateByRef).not.toHaveBeenCalled();
    });
  });
});
