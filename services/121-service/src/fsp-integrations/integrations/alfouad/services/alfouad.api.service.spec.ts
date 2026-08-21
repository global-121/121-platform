import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

const baseUrl = new URL('https://alfouad.example.org/');
const requestHeaders = new Headers({ Authorization: 'Bearer token' });

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

  describe('createTransaction', () => {
    it('should throw on a non-2xx HTTP status', async () => {
      // Arrange
      post.mockResolvedValue({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {},
      });

      // Act
      const act = service.createTransaction(createTransactionInput);

      // Assert
      await expect(act).rejects.toThrow(
        'Request to api/Transaction/TransactionCreate failed (HTTP 500)',
      );
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

  describe('getTransactionStateByRef', () => {
    it('should return the mapped state when found', async () => {
      // Arrange
      get.mockResolvedValue({
        status: HttpStatus.OK,
        data: { State: '2', Message: 'Approved' },
      });

      // Act
      const result = await service.getTransactionStateByRef({
        referenceNumber: 'RC-TEST-1',
        requestIdentity,
      });

      // Assert
      expect(result).toBe(AlfouadApiTransactionStateEnum.approved);
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
        requestIdentity,
      });

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
