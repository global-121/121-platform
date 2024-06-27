import { API_PATHS, EXTERNAL_API } from '@mock-service/src/config';
import {
  SafaricomTransferPayload,
  SafaricomTransferResponseBodyDto,
} from '@mock-service/src/fsp-integration/safaricom/safaricom.dto';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';

enum MockScenario {
  success = 'success',
  otherFailure = 'other-failure',
  noResponse = 'no-response',
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
  ): Promise<SafaricomTransferResponseBodyDto> {
    let mockScenario: MockScenario = MockScenario.success;
    if (!transferDto.PartyB) {
      mockScenario = MockScenario.otherFailure;
    }

    const transferResponse = {
      ConversationID: 'AG_20191219_00005797af5d7d75f652',
      OriginatorConversationID: transferDto.OriginatorConversationID,
      ResponseCode: mockScenario === MockScenario.success ? '0' : null,
      ResponseDescription:
        mockScenario === MockScenario.success
          ? 'Accept the service request successfully.'
          : 'Mock error message',
    };

    this.sendStatusCallback(transferResponse, mockScenario).catch((error) =>
      console.log(error),
    );

    return transferResponse;
  }

  private async sendStatusCallback(
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
    const otherFailureStatus = {
      Result: {
        ResultType: 0,
        ResultCode: 2001,
        ResultDesc: 'The initiator information is invalid.',
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

    // Switch between mock scenarios
    let Status;
    if (mockScenario === MockScenario.success) {
      Status = successStatus;
    } else if (mockScenario === MockScenario.otherFailure) {
      Status = otherFailureStatus;
    } else if (mockScenario === MockScenario.noResponse) {
      const errors = 'No response';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const response = {
      Result: Status.Result,
    };
    const httpService = new HttpService();
    const path = API_PATHS.safaricomCallback;
    const urlExternal = `${process.env.EXTERNAL_121_SERVICE_URL}api/${path}`;
    try {
      // Try to reach 121-service through external API url
      await lastValueFrom(httpService.post(urlExternal, response));
    } catch (error) {
      // In case external API is not reachable try internal network
      const urlInternal = `${EXTERNAL_API.rootApi}/${path}`;
      await lastValueFrom(httpService.post(urlInternal, response)).catch(
        (error) => console.log(error),
      );
    }
  }
}
