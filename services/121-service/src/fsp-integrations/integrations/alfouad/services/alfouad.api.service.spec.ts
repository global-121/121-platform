import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.interface';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

const baseUrl = new URL('https://alfouad.example.org/');
const requestHeaders = new Headers({ Authorization: 'Bearer token' });

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

describe('AlfouadApiService', () => {
  let service: AlfouadApiService;
  let post: jest.Mock;
  let get: jest.Mock;

  beforeEach(async () => {
    post = jest.fn();
    get = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlfouadApiService,
        {
          provide: CustomHttpService,
          useValue: { post, get },
        },
        {
          provide: AlfouadApiHelperService,
          useValue: {
            getBaseUrl: jest.fn().mockReturnValue(baseUrl),
            buildAuthorizationToken: jest.fn().mockReturnValue('auth-value'),
            createRequestHeaders: jest.fn().mockReturnValue(requestHeaders),
          },
        },
        {
          provide: AlfouadEncryptionService,
          useValue: { encrypt: jest.fn().mockReturnValue('encrypted-password') },
        },
      ],
    }).compile();

    service = module.get<AlfouadApiService>(AlfouadApiService);
  });

  describe('Creating a transaction', () => {
    it('should normalize the wire response into a camelCase result', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '1', Message: 'Success', ErrorCode: undefined },
      });

      // Act
      const result = await service.createTransaction(createTransactionInput);

      // Assert
      expect(result).toEqual({
        state: '1',
        message: 'Success',
        errorCode: undefined,
      });
    });

    it('should wrap errors thrown by the HTTP service', async () => {
      // Arrange
      post.mockRejectedValue(new Error('network down'));

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).rejects.toThrow(
        'Error calling api/Transaction/TransactionCreate: network down',
      );
    });

    it('should recover the TransactionUID via TransactionByRef on a duplicate (822)', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '0',
          Message: 'duplicate Reference Number',
          ErrorCode: '822',
        },
      });
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '1',
          Message: 'Pending_Approval',
          TransactionInfo: { TransactionUID: '519090100013' },
        },
      });

      // Act
      const result = await service.createTransfer(createTransferInput);

      // Assert
      expect(result).toEqual({ transactionUid: '519090100013' });
    });

    it('should throw on a duplicate (822) when the transaction cannot be found', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '0',
          Message: 'duplicate Reference Number',
          ErrorCode: '822',
        },
      });
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '0', Message: 'Not found' },
      });

      // Act
      const act = service.createTransfer(createTransferInput);

      // Assert
      await expect(act).rejects.toThrow('was not found');
      await expect(act).rejects.toHaveProperty('errorCode', '822');
    });
  });

  describe('getTransactionByRef', () => {
    it('should return the mapped state and TransactionUID when found', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '2',
          Message: 'Approved',
          TransactionInfo: { TransactionUID: '519090100013' },
        },
      });

      // Act
      const result = await service.getTransactionByRef({
        referenceNumber: 'RC-TEST-1',
        requestIdentity,
      });

      // Assert
      expect(result).toEqual({
        state: AlfouadApiTransactionStateEnum.approved,
        transactionUid: '519090100013',
      });
      expect(get).toHaveBeenCalledWith(
        'https://alfouad.example.org/api/Transaction/TransactionByRef?ReferenceNumber=RC-TEST-1',
        requestHeaders,
      );
    });

    it('should return undefined when the state is not a known lifecycle state', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '0', Message: 'Not found' },
      });

      // Act
      const result = await service.getTransactionByRef({
        referenceNumber: 'RC-TEST-1',
        requestIdentity,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw when no response body is returned', async () => {
      // Arrange
      get.mockResolvedValue({ status: HttpStatus.OK, data: null });

      // Act
      const act = service.getTransactionByRef({
        referenceNumber: 'RC-TEST-1',
        requestIdentity,
      });

      // Assert
      await expect(act).rejects.toThrow('No response body received');
    });
  });

  describe('Getting a transaction state by reference number', () => {
    it('should return the mapped state when found', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '2', Message: 'Approved' },
      });

      // Act
      const result = await service.getTransactionStateByRef({
        referenceNumber: 'RC-TEST-1',
        authIdentity,
      });

      // Assert
      expect(result).toBe(AlfouadApiTransactionState.approved);
    });

    it('should return undefined when the state is not a known lifecycle state', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '0', Message: 'Not found' },
      });

      // Act
      const result = await service.getTransactionStateByRef({
        referenceNumber: 'RC-TEST-1',
        authIdentity,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw when the response body is empty or malformed', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: undefined,
      });

      // Act
      const act = service.getTransactionStateByRef({
        referenceNumber: 'RC-TEST-1',
        authIdentity,
      });

      // Assert
      await expect(act).rejects.toThrow(
        'No response received from Al Fouad API for api/Transaction/TransactionByRef?ReferenceNumber=RC-TEST-1.',
      );
    });
  });
});
