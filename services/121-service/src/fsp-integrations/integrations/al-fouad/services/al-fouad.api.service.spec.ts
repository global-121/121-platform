import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AlFouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-create-transaction-params.interface';
import { AlFouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.helper.service';
import { AlFouadApiService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.service';
import { AlFouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

const baseUrl = new URL('https://alfouad.example.org/');
const requestHeaders = new Headers({ Authorization: 'Bearer token' });

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

describe('AlFouadApiService', () => {
  let service: AlFouadApiService;
  let post: jest.Mock;
  let get: jest.Mock;

  beforeEach(async () => {
    post = jest.fn();
    get = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlFouadApiService,
        {
          provide: CustomHttpService,
          useValue: { post, get },
        },
        {
          provide: AlFouadApiHelperService,
          useValue: {
            getBaseUrl: jest.fn().mockReturnValue(baseUrl),
            buildAuthorizationToken: jest.fn().mockReturnValue('auth-value'),
            createRequestHeaders: jest.fn().mockReturnValue(requestHeaders),
          },
        },
        {
          provide: AlFouadEncryptionService,
          useValue: { encrypt: jest.fn().mockReturnValue('encrypted-password') },
        },
      ],
    }).compile();

    service = module.get<AlFouadApiService>(AlFouadApiService);
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
      expect(result).toBe(AlFouadApiTransactionState.approved);
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
