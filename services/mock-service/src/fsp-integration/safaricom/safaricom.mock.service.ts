import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { API_PATHS, EXTERNAL_API } from '../../config';
import { SafaricomTransferPayload } from './safaricom.dto';

@Injectable()
export class SafaricomMockService {
  public async authenticate(): Promise<object> {
    console.log('authenticate: ');
    return {
      access_token: 'mock_access_token',
      expires_in: 3600,
    };
  }

  public async transfer(
    transferDto: SafaricomTransferPayload,
  ): Promise<object> {
    const response = {
      ConversationID: 'AG_20191219_00005797af5d7d75f652',
      OriginatorConversationID: transferDto.OriginatorConversationID,
      ResponseCode: '0', // means success
      ResponseDescription: 'Accept the service request successfully.',
    };
    console.log('response: ', response);

    // TODO: trigger callback
    this.sendStatusCallback(transferDto);

    return response;
  }

  private async sendStatusCallback(
    transferDto: SafaricomTransferPayload,
  ): Promise<void> {
    const mockScenario: string = 'success'; // Set 'success' / 'other-failure' / 'no-response' to test the corresponding scenario

    const successStatus = {
      Result: {
        ResultType: 0,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        OriginatorConversationID: transferDto.OriginatorConversationID,
        ConversationID: 'AG_20191219_00005797af5d7d75f652',
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
        OriginatorConversationID: transferDto.OriginatorConversationID,
        ConversationID: 'AG_20191219_00006c6fddb15123addf',
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
    if (mockScenario === 'success') {
      Status = successStatus;
    } else if (mockScenario === 'other-failure') {
      Status = otherFailureStatus;
    } else if (mockScenario === 'no-response') {
      const errors = 'No response';
      throw new HttpException({ errors }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // await setTimeout(30);
    const response = {
      Result: Status.Result,
    };
    console.log('response: ', response);
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
