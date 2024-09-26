import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import {
  SafaricomTransferPayload,
  SafaricomTransferResponseBodyDto,
} from '@mock-service/src/fsp-integration/safaricom/safaricom.dto';

enum MockScenario {
  success = 'success',
  errorOnRequest = 'error-on-request',
  errorOnCallback = 'error-on-callback',
  errorOnCallbackForTimeOut = 'error-on-callback-for-timeout',
}
@Injectable()
export class SafaricomMockService {
  public async authenticate(): Promise<object> {
    return {
      access_token: 'mock_access_token',
      expires_in: 3600,
    };
  }

  public async transfer(
    transferDto: SafaricomTransferPayload,
  ): Promise<
    Partial<SafaricomTransferResponseBodyDto | SafaricomTransferPayload>
  > {
    let mockScenario: MockScenario = MockScenario.success;
    if (transferDto.PartyB === '254000000000') {
      mockScenario = MockScenario.errorOnRequest;
    } else if (transferDto.PartyB === '254000000001') {
      mockScenario = MockScenario.errorOnCallback;
    } else if (transferDto.PartyB === '254000000002') {
      mockScenario = MockScenario.errorOnCallbackForTimeOut;
    }

    if (mockScenario === MockScenario.errorOnRequest) {
      return {
        errorCode: '401.002.01',
        errorMessage:
          'Error Occurred - Invalid Access Token - mocked_access_token',
      };
    }

    const transferResponse = {
      ConversationID: 'AG_20191219_00005797af5d7d75f652',
      OriginatorConversationID: transferDto.OriginatorConversationID,
      ResponseCode: '0',
      ResponseDescription: 'Accept the service request successfully.',
    };

    this.sendStatusCallback(transferDto, transferResponse, mockScenario).catch(
      (error) => console.log(error),
    );

    return transferResponse;
  }

  private async sendStatusCallback(
    transferDto: SafaricomTransferPayload,
    transferResponse: SafaricomTransferResponseBodyDto,
    mockScenario: MockScenario,
  ): Promise<void> {
    await setTimeout(300);
    const successStatus = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: transferResponse.OriginatorConversationID,
        ConversationID: transferResponse.ConversationID,
        TransactionID: 'NLJ41HAY6Q',
        ResultParameters: {
          ResultParameter: [
            {
              Key: 'TransactionAmount',
              Value: 10,
            },
            {
              Key: 'TransactionReceipt',
              Value: 'NLJ41HAY6Q',
            },
            {
              Key: 'B2CRecipientIsRegisteredCustomer',
              Value: 'Y',
            },
            {
              Key: 'B2CChargesPaidAccountAvailableFunds',
              Value: -4510.0,
            },
            {
              Key: 'ReceiverPartyPublicName',
              Value: '254708374149 - John Doe',
            },
            {
              Key: 'TransactionCompletedDateTime',
              Value: '19.12.2019 11:45:50',
            },
            {
              Key: 'B2CUtilityAccountAvailableFunds',
              Value: 10116.0,
            },
            {
              Key: 'B2CWorkingAccountAvailableFunds',
              Value: 900000.0,
            },
          ],
        },
        ReferenceData: {
          ReferenceItem: {
            Key: 'QueueTimeoutURL',
            Value:
              'https://internalsandbox.safaricom.co.ke/mpesa/b2cresults/v1/submit',
          },
        },
      },
    };
    const callbackErrorResponse = {
      Result: {
        ResultType: 0,
        ResultCode: 2001,
        ResultDesc: 'The phone number does not have M-PESA.',
        OriginatorConversationID: transferResponse.OriginatorConversationID,
        ConversationID: transferResponse.ConversationID,
        TransactionID: 'NLJ0000000',
        ReferenceData: {
          ReferenceItem: {
            Key: 'QueueTimeoutURL',
            Value:
              'https://internalsandbox.safaricom.co.ke/mpesa/b2cresults/v1/submit',
          },
        },
      },
    };

    const httpService = new HttpService();

    // Switch between mock scenarios
    let response = {};
    let url = `${EXTERNAL_API_ROOT}/${API_PATHS.safaricomTransferCallback}`;
    if (mockScenario === MockScenario.success) {
      response = {
        Result: successStatus.Result,
      };
    } else if (mockScenario === MockScenario.errorOnCallback) {
      response = {
        Result: callbackErrorResponse.Result,
      };
    } else if (mockScenario === MockScenario.errorOnCallbackForTimeOut) {
      // Based on Job Kipngetich reponse from safaricom,
      // The initial request payload has been returned on the QueueTimeoutURL if the transaction times out on M-PESA.
      response = transferDto;
      url = `${EXTERNAL_API_ROOT}/${API_PATHS.safaricomTimeoutCallback}`;
    }

    await lastValueFrom(httpService.post(url, response)).catch((error) =>
      console.log(error),
    );
  }
}
