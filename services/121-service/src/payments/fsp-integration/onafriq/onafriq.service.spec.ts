import { TestBed } from '@automock/jest';

import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { CallServiceResult } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/call-service-result.interface.';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';

const mockedCreateTransactionParams: CreateTransactionParams = {
  transferAmount: 100,
  phoneNumber: '254708374149',
  thirdPartyTransId: 'mocked_third_party_trans_id',
  firstName: 'mocked_first_name',
  lastName: 'mocked_last_name',
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
    it('should create Onafriq transaction', async () => {
      const callServiceResult: CallServiceResult = {
        status: OnafriqApiResponseStatusType.success,
      };

      jest
        .spyOn(onafriqApiService, 'callService')
        .mockResolvedValue(callServiceResult);

      await onafriqService.createTransaction(mockedCreateTransactionParams);

      expect(onafriqApiService.callService).toHaveBeenCalledWith({
        transferAmount: mockedCreateTransactionParams.transferAmount,
        phoneNumber: mockedCreateTransactionParams.phoneNumber,
        firstName: mockedCreateTransactionParams.firstName,
        lastName: mockedCreateTransactionParams.lastName,
        thirdPartyTransId: mockedCreateTransactionParams.thirdPartyTransId,
      });
    });
  });
});
