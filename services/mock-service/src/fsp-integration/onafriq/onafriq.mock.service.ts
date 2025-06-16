import { Injectable } from '@nestjs/common';

import {
  OnafriqCallServicePayload,
  OnafriqCallServiceResponseBodyDto,
} from '@mock-service/src/fsp-integration/onafriq/onafriq.dto';

// enum MockScenario {
//   success = 'success',
//   errorOnRequest = 'error-on-request',
//   errorOnCallback = 'error-on-callback',
//   errorOnCallbackForTimeOut = 'error-on-callback-for-timeout',
// }
@Injectable()
export class OnafriqMockService {
  public async callService(
    callServiceDto: OnafriqCallServicePayload,
  ): Promise<OnafriqCallServiceResponseBodyDto> {
    // let mockScenario: MockScenario = MockScenario.success;
    // if (callServiceDto.PartyB === '254000000000') {
    //   mockScenario = MockScenario.errorOnRequest;
    // } else if (callServiceDto.PartyB === '254000000001') {
    //   mockScenario = MockScenario.errorOnCallback;
    // } else if (callServiceDto.PartyB === '254000000002') {
    //   mockScenario = MockScenario.errorOnCallbackForTimeOut;
    // }

    // if (mockScenario === MockScenario.errorOnRequest) {
    //   return {
    //     errorCode: '401.002.01',
    //     errorMessage:
    //       'Error Occurred - Invalid Access Token - mocked_access_token',
    //   };
    // }

    const callServiceResponse = {
      totalTxSent: 1,
      noTxAccepted: 1,
      noTxRejected: 0,
      details: {
        transResponse: [
          {
            thirdPartyId: callServiceDto.requestBody[0].thirdPartyTransId,
            status: {
              code: '100',
              message: 'Accepted',
            },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    // this.sendStatusCallback(callServiceDto, transferResponse, mockScenario).catch(
    //   (error) => console.log(error),
    // );

    return { data: callServiceResponse };
  }

  // private async sendStatusCallback(
  //   transferDto: OnafriqCallServicePayload,
  //   transferResponse: OnafriqCallServiceResponseBodyDto,
  //   mockScenario: MockScenario,
  // ): Promise<void> {
  //   await setTimeout(300);
  //   const successStatus = {
  //     Result: {
  //       ResultType: 0,
  //       ResultCode: 0,
  //       ResultDesc: 'The service request is processed successfully.',
  //       OriginatorConversationID: transferResponse.OriginatorConversationID,
  //       ConversationID: transferResponse.ConversationID,
  //       TransactionID: 'NLJ41HAY6Q',
  //       ResultParameters: {
  //         ResultParameter: [
  //           {
  //             Key: 'TransactionAmount',
  //             Value: 10,
  //           },
  //           {
  //             Key: 'TransactionReceipt',
  //             Value: 'NLJ41HAY6Q',
  //           },
  //           {
  //             Key: 'B2CRecipientIsRegisteredCustomer',
  //             Value: 'Y',
  //           },
  //           {
  //             Key: 'B2CChargesPaidAccountAvailableFunds',
  //             Value: -4510.0,
  //           },
  //           {
  //             Key: 'ReceiverPartyPublicName',
  //             Value: '254708374149 - John Doe',
  //           },
  //           {
  //             Key: 'TransactionCompletedDateTime',
  //             Value: '19.12.2019 11:45:50',
  //           },
  //           {
  //             Key: 'B2CUtilityAccountAvailableFunds',
  //             Value: 10116.0,
  //           },
  //           {
  //             Key: 'B2CWorkingAccountAvailableFunds',
  //             Value: 900000.0,
  //           },
  //         ],
  //       },
  //       ReferenceData: {
  //         ReferenceItem: {
  //           Key: 'QueueTimeoutURL',
  //           Value:
  //             'https://internalsandbox.onafriq.co.ke/mpesa/b2cresults/v1/submit',
  //         },
  //       },
  //     },
  //   };
  //   const callbackErrorResponse = {
  //     Result: {
  //       ResultType: 0,
  //       ResultCode: 2001,
  //       ResultDesc: 'The phone number does not have M-PESA.',
  //       OriginatorConversationID: transferResponse.OriginatorConversationID,
  //       ConversationID: transferResponse.ConversationID,
  //       TransactionID: 'NLJ0000000',
  //       ReferenceData: {
  //         ReferenceItem: {
  //           Key: 'QueueTimeoutURL',
  //           Value:
  //             'https://internalsandbox.onafriq.co.ke/mpesa/b2cresults/v1/submit',
  //         },
  //       },
  //     },
  //   };

  //   const httpService = new HttpService();

  //   // Switch between mock scenarios
  //   let response = {};
  //   let url = `${EXTERNAL_API_ROOT}/${API_PATHS.onafriqTransferCallback}`;
  //   if (mockScenario === MockScenario.success) {
  //     response = {
  //       Result: successStatus.Result,
  //     };
  //   } else if (mockScenario === MockScenario.errorOnCallback) {
  //     response = {
  //       Result: callbackErrorResponse.Result,
  //     };
  //   } else if (mockScenario === MockScenario.errorOnCallbackForTimeOut) {
  //     // Based on Job Kipngetich reponse from onafriq,
  //     // The initial request payload has been returned on the QueueTimeoutURL if the transaction times out on M-PESA.
  //     response = transferDto;
  //     url = `${EXTERNAL_API_ROOT}/${API_PATHS.onafriqTimeoutCallback}`;
  //   }

  //   await lastValueFrom(httpService.post(url, response)).catch((error) =>
  //     console.log(error),
  //   );
  // }
}
