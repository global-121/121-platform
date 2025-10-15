import { TestBed } from '@automock/jest';

import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { CallServiceResult } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/call-service-result.interface.';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';

const mockedCreateTransactionParams: CreateTransactionParams = {
  transferAmount: 100,
  phoneNumberPayment: '254708374149',
  thirdPartyTransId: 'mocked_third_party_trans_id',
  firstName: 'mocked_first_name',
  lastName: 'mocked_last_name',
  credentials: {
    corporateCode: 'mocked_corporate_code',
    password: 'mocked_password',
    uniqueKey: 'mocked_unique_key',
  },
};

describe('OnafriqService', () => {
  let onafriqService: OnafriqService;
  let onafriqApiService: OnafriqApiService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(OnafriqService).compile();

    onafriqService = unit;
    onafriqApiService = unitRef.get(OnafriqApiService);
  });

  describe('createTransaction', () => {
    it('should complete successfully when API returns success status', async () => {
      const successResponse: CallServiceResult = {
        status: OnafriqApiResponseStatusType.success,
      };

      jest
        .spyOn(onafriqApiService, 'callService')
        .mockResolvedValue(successResponse);

      await expect(
        onafriqService.createTransaction(mockedCreateTransactionParams),
      ).resolves.not.toThrow();

      expect(onafriqApiService.callService).toHaveBeenCalledWith(
        mockedCreateTransactionParams,
      );
    });

    it('should throw OnafriqError when API returns non-success status', async () => {
      const errorStatus = OnafriqApiResponseStatusType.genericError;
      const errorMessage = 'mock_error_message';

      const errorResponse: CallServiceResult = {
        status: errorStatus,
        errorMessage,
      };

      jest
        .spyOn(onafriqApiService, 'callService')
        .mockResolvedValue(errorResponse);

      await expect(
        onafriqService.createTransaction(mockedCreateTransactionParams),
      ).rejects.toThrow(new OnafriqError(errorMessage, errorStatus));

      expect(onafriqApiService.callService).toHaveBeenCalledWith(
        mockedCreateTransactionParams,
      );
    });
  });
});
