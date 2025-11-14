import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia-api.error';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CooperativeBankOfOromiaEncryptionService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.encryption.service';
import { CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/enums/cooperative-bank-of-oromia-api-disbursement-result-status.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

const responseWrapper = (obj) => ({
  data: obj,
});

const authenticationSuccessResponse = responseWrapper({
  access_token: 'mock-access-token',
  expires_in: 180,
});

const disburseInput = {
  cooperativeBankOfOromiaTransactionId: 'mock-transaction-id',
  phoneNumberWithoutCountryCode: '000000000',
  amount: 200,
};

// A full example of a response we can parse successfully.
const disburseSuccessResponse = responseWrapper({
  data: {
    transaction: {
      airtel_money_id: 'product-partner-**41',
      id: 'AB***141',
      reference_id: '18****354',
      status: 'TS',
    },
  },
  status: {
    code: '200',
    message: 'Success',
    response_code: CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001001,
    result_code: 'ESB000010',
    success: true,
  },
});

const enquireInput = {
  cooperativeBankOfOromiaTransactionId: 'mock-transaction-id',
};

// A full example of a response we can parse successfully.
const enquireSuccessResponse = responseWrapper({
  data: {
    transaction: {
      airtel_money_id:
        'disbursement-Y79CTORHGI-NZAi8erxBOqqgKFu30LJfqXwwAHF3zRMWjd9Z1VR',
      id: 'NZAi8erxBOqqgKFu30LJfqXwwAHF3zRMWjd9Z1VR',
      message: 'Success',
      status: 'TS',
    },
  },
  status: {
    response_code: CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001001,
    code: '200',
    success: true,
    result_code: 'ESB000010',
    message: 'SUCCESS',
  },
});

const unknownResponse = {
  data: 'could be anything',
};

describe('CooperativeBankOfOromiaApiService', () => {
  let cooperativeBankOfOromiaApiService: CooperativeBankOfOromiaApiService;
  let customHttpService: CustomHttpService;
  let post: jest.Mock;
  let get: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooperativeBankOfOromiaApiService,
        TokenValidationService,
        {
          provide: CustomHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: CooperativeBankOfOromiaEncryptionService,
          useValue: {
            encryptPinV1: jest.fn().mockReturnValue('mock-encrypted-pin'),
          },
        },
        {
          provide: CooperativeBankOfOromiaApiHelperService,
          useValue: new CooperativeBankOfOromiaApiHelperService(),
        },
      ],
    }).compile();

    cooperativeBankOfOromiaApiService = module.get<CooperativeBankOfOromiaApiService>(CooperativeBankOfOromiaApiService);
    customHttpService = module.get<CustomHttpService>(CustomHttpService);

    // We often use mockOnce for post because the first post is authentication and subsequent ones are for disbursement.
    post = customHttpService.post as jest.Mock;
    get = customHttpService.get as jest.Mock;
  });

  describe('disburse', () => {
    describe('authenticate', () => {
      it('calls authenticate endpoint', async () => {
        // Arrange
        // mock values needed else disburse() will throw.
        post.mockResolvedValueOnce(authenticationSuccessResponse);
        post.mockResolvedValue(disburseSuccessResponse);

        // Act
        await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        // First call is authenticate().
        // Mask client_id and client_secret in the body for snapshot so we don't (accidentally) leak sandbox secrets.
        const [url, body, headers] = post.mock.calls[0];
        expect(url).toBe(
          'http://mock-service:3001/api/fsp/cooperative-bank-of-oromia/auth/oauth2/token',
        );
        expect(typeof body.client_id).toBe('string');
        expect(typeof body.client_secret).toBe('string');
        expect(body.grant_type).toBe('client_credentials');
        expect(headers).toMatchSnapshot();
      });

      // We test authenticate failures here, not again in enquire() because it's the same code path.
      it('throws an CooperativeBankOfOromiaApiError when authentication was unsuccessful because of invalid secrets', async () => {
        // Arrange
        // Only need to mock the first.
        post.mockResolvedValueOnce({
          error_description: 'Invalid client authentication',
          error: 'invalid_client',
        });

        // Act
        let error: CooperativeBankOfOromiaApiError | any; // The any is unfortunately needed to prevent type errors
        try {
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);
        } catch (e) {
          error = e;
        }

        // Assert
        expect(error).toBeInstanceOf(CooperativeBankOfOromiaApiError);
        expect(error.message).toMatchSnapshot();
        // Should not have called the disburse endpoint, because authentication failed.
        expect(post).toHaveBeenCalledTimes(1);
      });

      it('throws an CooperativeBankOfOromiaApiError when authentication call fails because of network error', async () => {
        // Arrange
        // Only need to mock the first.
        post.mockRejectedValue(new Error('Network error'));

        // Act
        let error: CooperativeBankOfOromiaApiError | any; // The any is unfortunately needed to prevent type errors
        try {
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);
        } catch (e) {
          error = e;
        }

        // Assert
        expect(error).toBeInstanceOf(CooperativeBankOfOromiaApiError);
        expect(error.message).toMatchSnapshot();
        // Should not have called the disburse endpoint, because authentication failed.
        expect(post).toHaveBeenCalledTimes(1);
      });

      it('throws an CooperativeBankOfOromiaApiError when authentication call fails because of unknown response', async () => {
        // Arrange
        // Only need to mock the first.
        post.mockResolvedValueOnce(unknownResponse);

        // Act
        let error: CooperativeBankOfOromiaApiError | any; // The any is unfortunately needed to prevent type errors
        try {
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);
        } catch (e) {
          error = e;
        }

        // Assert
        expect(error).toBeInstanceOf(CooperativeBankOfOromiaApiError);
        expect(error.message).toMatchSnapshot();
        // Should not have called the disburse endpoint, because authentication failed.
        expect(post).toHaveBeenCalledTimes(1);
      });
    });

    describe('authenticated', () => {
      beforeEach(async () => {
        // First call is authenticate() so mockResolvedValueOnce.
        post.mockResolvedValueOnce(authenticationSuccessResponse);
      });

      it('correctly calls disburse endpoint', async () => {
        // Arrange
        post.mockResolvedValue(disburseSuccessResponse);

        // Act
        const result = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        // Second call is disburse()
        expect(post).toHaveBeenCalledTimes(2);
        // Also checks the message, even though we don't show that in the UI.
        expect(result).toEqual({
          message: 'Success (DP00900001001)',
          result: 'success',
        });
        const [urlCalled, payload, headers] = post.mock.calls[1];
        expect(urlCalled).toBe(
          'http://mock-service:3001/api/fsp/cooperative-bank-of-oromia/standard/v2/disbursements/',
        );
        expect(payload).toEqual({
          payee: {
            currency: 'ZMW',
            msisdn: '000000000',
          },
          pin: 'mock-encrypted-pin',
          reference: '1234',
          transaction: {
            amount: 200,
            id: 'mock-transaction-id',
            type: 'B2C',
          },
        });
        expect(headers).toEqual([
          {
            name: 'Accept',
            value: '*/*',
          },
          {
            name: 'Authorization',
            value: 'Bearer mock-access-token',
          },
          {
            name: 'Content-type',
            value: 'application/json',
          },
          {
            name: 'X-country',
            value: 'ZM',
          },
          {
            name: 'X-currency',
            value: 'ZMW',
          },
        ]);
      });

      it("correctly handles response code 'DP00900001000' (ambiguous)", async () => {
        // Arrange
        post.mockResolvedValue(
          responseWrapper({
            status: {
              message: 'Transaction ambiguous.',
              response_code:
                CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001000,
            },
          }),
        );

        // Act
        const { result, message } =
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(result).toBe(CooperativeBankOfOromiaDisbursementResultEnum.ambiguous);
        expect(message).toBe('Transaction ambiguous. (DP00900001000)');
      });

      it("correctly handles response code 'DP00900001011' (duplicate)", async () => {
        // Arrange
        post.mockResolvedValue(
          responseWrapper({
            status: {
              message: 'Transaction duplicate.',
              response_code:
                CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001011,
            },
          }),
        );

        // Act
        const { result, message } =
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(result).toBe(CooperativeBankOfOromiaDisbursementResultEnum.duplicate);
        expect(message).toBe('Transaction duplicate. (DP00900001011)');
      });

      it('returns a "fail" when we receive an unknown response code.', async () => {
        // Arrange
        post.mockResolvedValue(
          responseWrapper({
            status: {
              response_code: 'DP0090000XXXX',
            },
          }),
        );

        // Act
        const { result } = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(result).toBe(CooperativeBankOfOromiaDisbursementResultEnum.fail);
      });

      it('returns a "fail" when we receive no response code.', async () => {
        // Arrange
        post.mockResolvedValue(unknownResponse);

        // Act
        const { result } = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(result).toBe(CooperativeBankOfOromiaDisbursementResultEnum.fail);
      });

      it('parses the message and combines with response code when we receive an unknown response code', async () => {
        // Arrange
        // A response code we don't know, but a message we can parse.
        post.mockResolvedValue(
          responseWrapper({
            status: {
              message: 'mock-message',
              response_code: 'DP0090000XXXX',
            },
          }),
        );

        // Act
        const { message } = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(message).toBe('mock-message (DP0090000XXXX)');
      });

      it('JSON.stringifies the whole response when we receive an unknown response code and no message', async () => {
        // Arrange
        // A response code we don't know, but a message we can parse.
        const mockPostResponse = {
          status: {
            response_code: 'DP0090000XXXX',
          },
        };
        post.mockResolvedValue(responseWrapper(mockPostResponse));

        // Act
        const { message } = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(message).toBe(JSON.stringify(mockPostResponse));
      });

      it('JSON.stringifies the whole response when we receive no response code and no message', async () => {
        // Arrange
        post.mockResolvedValue(responseWrapper(unknownResponse));

        // Act
        const { message } = await cooperativeBankOfOromiaApiService.disburse(disburseInput);

        // Assert
        expect(message).toBe(JSON.stringify(unknownResponse));
      });

      it("throws an CooperativeBankOfOromiaApiError when there's a network error", async () => {
        // Arrange
        post.mockRejectedValueOnce(new Error('Network error'));

        // Act
        let error: CooperativeBankOfOromiaApiError | any; // The any is unfortunately needed to prevent type errors
        try {
          await cooperativeBankOfOromiaApiService.disburse(disburseInput);
        } catch (e) {
          error = e;
        }

        // Assert
        // Both authenticate and disburse calls were made.
        expect(post).toHaveBeenCalledTimes(2);
        expect(error).toBeInstanceOf(CooperativeBankOfOromiaApiError);
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  describe('enquire', () => {
    // We don't fully re-test authenticate here, just the happy path
    beforeEach(async () => {
      // First call is authenticate() so mockResolvedValueOnce.
      post.mockResolvedValueOnce(authenticationSuccessResponse);
    });

    it('calls authenticate endpoint', async () => {
      // Arrange
      // mock values needed else enquire() will throw.
      get.mockResolvedValue(enquireSuccessResponse);

      // Act
      await cooperativeBankOfOromiaApiService.enquire(enquireInput);

      // Assert
      // First call is authenticate().
      // Mask client_id and client_secret in the body for snapshot so we don't (accidentally) leak sandbox secrets.
      const [url, body, headers] = post.mock.calls[0];
      expect(url).toBe(
        'http://mock-service:3001/api/fsp/cooperative-bank-of-oromia/auth/oauth2/token',
      );
      expect(typeof body.client_id).toBe('string');
      expect(typeof body.client_secret).toBe('string');
      expect(body.grant_type).toBe('client_credentials');
      expect(headers).toMatchSnapshot();
    });

    it('correctly calls enquire endpoint', async () => {
      // Arrange
      get.mockResolvedValue(enquireSuccessResponse);

      // Act
      const result = await cooperativeBankOfOromiaApiService.enquire(enquireInput);

      // Assert
      // Second call is enquire()
      expect(get).toHaveBeenCalledTimes(1);
      expect(result).toMatchSnapshot();
      expect(get.mock.calls[0]).toMatchSnapshot();
    });

    // We don't test all the variations here because we've indirectly tested
    // getMessage and getResult already in the tests for disburse().
    it('JSON.stringifies the whole response when we receive no response code and no message', async () => {
      // Arrange
      get.mockResolvedValue(responseWrapper(unknownResponse));

      // Act
      const { message } = await cooperativeBankOfOromiaApiService.enquire(enquireInput);

      // Assert
      expect(message).toBe(JSON.stringify(unknownResponse));
    });

    it("throws an CooperativeBankOfOromiaApiError when there's a network error", async () => {
      // Arrange
      get.mockRejectedValueOnce(new Error('Network error'));

      // Act
      let error: CooperativeBankOfOromiaApiError | any; // The any is unfortunately needed to prevent type errors
      try {
        await cooperativeBankOfOromiaApiService.enquire(enquireInput);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(get).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(CooperativeBankOfOromiaApiError);
      expect(error.message).toMatchSnapshot();
    });
  });
});
