import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-params.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

const baseUrl = new URL('https://alfouad.example.org/');
const expectedUrl =
  'https://alfouad.example.org/api/Transaction/TransactionCreate';
const requestHeaders = new Headers({ Authorization: 'Bearer token' });

const requestIdentity: AlfouadRequestIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

const createTransferInput: AlfouadCreateTransferParams = {
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
            buildAuthorizationValue: jest.fn().mockReturnValue('auth-value'),
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

  describe('createTransfer', () => {
    it('should return the TransactionUID on success', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '1',
          Message: 'Success',
          TransactionInfo: { TransactionUID: '519090100013' },
        },
      });

      // Act
      const result = await service.createTransfer(createTransferInput);

      // Assert
      expect(result).toEqual({ transactionUid: '519090100013' });
      expect(post).toHaveBeenCalledWith(
        expectedUrl,
        {
          SenderFullName: 'Test Sender',
          SenderPhoneNumber: '0900000000',
          BeneficiaryFullName: 'Test Beneficiary',
          BeneficiaryPhoneNumber: '0911111111',
          ReferenceNumber: 'RC-TEST-1',
          CountryCode: 'SY',
          CityCode: 'Damascus',
          DeliveryCurrencyCode: 'SYP',
          DeliveryAmount: 10000,
        },
        requestHeaders,
      );
    });

    it('should throw with the message and error code when State is not success', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: {
          State: '0',
          Message: "You don't have permission to exceed the account limit.",
          ErrorCode: '45',
        },
      });

      // Act
      const act = service.createTransfer(createTransferInput);

      // Assert
      await expect(act).rejects.toBeInstanceOf(AlfouadApiError);
      await expect(act).rejects.toThrow('account limit');
      await expect(act).rejects.toHaveProperty('errorCode', '45');
    });

    it('should throw when no response body is returned', async () => {
      // Arrange
      post.mockResolvedValue({ status: HttpStatus.OK, data: null });

      // Act
      const act = service.createTransfer(createTransferInput);

      // Assert
      await expect(act).rejects.toThrow('No response body received');
    });

    it('should throw when the success response has no TransactionUID', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '1', Message: 'Success' },
      });

      // Act
      const act = service.createTransfer(createTransferInput);

      // Assert
      await expect(act).rejects.toThrow('no TransactionUID was returned');
    });

    it('should throw on a non-2xx HTTP status', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {},
      });

      // Act
      const act = service.createTransfer(createTransferInput);

      // Assert
      await expect(act).rejects.toThrow(
        'Request to api/Transaction/TransactionCreate failed (HTTP 500)',
      );
    });

    it('should wrap errors thrown by the HTTP service', async () => {
      // Arrange
      post.mockRejectedValue(new Error('network down'));

      // Act
      const act = service.createTransfer(createTransferInput);

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
});
