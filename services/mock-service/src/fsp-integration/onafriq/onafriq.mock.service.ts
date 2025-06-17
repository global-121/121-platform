import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import {
  OnafriqCallServicePayload,
  OnafriqCallServiceResponseBodyDto,
} from '@mock-service/src/fsp-integration/onafriq/onafriq.dto';

enum MockScenario {
  success = 'success',
  errorOnRequest = 'error-on-request',
  errorOnCallback = 'error-on-callback',
}
@Injectable()
export class OnafriqMockService {
  public async callService(
    callServiceDto: OnafriqCallServicePayload,
  ): Promise<OnafriqCallServiceResponseBodyDto> {
    let mockScenario: MockScenario = MockScenario.success;
    if (callServiceDto.requestBody[0].recipient.msisdn === '24300000000') {
      mockScenario = MockScenario.errorOnRequest;
    } else if (
      callServiceDto.requestBody[0].recipient.msisdn === '24300000001'
    ) {
      mockScenario = MockScenario.errorOnCallback;
    }

    if (mockScenario === MockScenario.errorOnRequest) {
      return {
        totalTxSent: 1,
        noTxAccepted: 0,
        noTxRejected: 1,
        details: {
          transResponse: [
            {
              thirdPartyId: callServiceDto.requestBody[0].thirdPartyTransId,
              status: {
                code: '101',
                message: 'Rejected',
                messageDetail: 'Generic mock error on request',
              },
            },
          ],
        },
        timestamp: new Date().toISOString(),
      };
    }

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

    this.sendStatusCallback(callServiceDto, mockScenario).catch((error) =>
      console.log(error),
    );

    return callServiceResponse;
  }

  private async sendStatusCallback(
    callServiceDto: OnafriqCallServicePayload,
    mockScenario: MockScenario,
  ): Promise<void> {
    await setTimeout(300);
    const successStatus = {
      thirdPartyTransId: callServiceDto.requestBody[0].thirdPartyTransId,
      mfsTransId: '1126231250437',
      e_trans_id: '11524180437',
      fxRate: 3720.765,
      status: {
        code: 'MR101',
        message: 'success',
      },
      receiveAmount: {
        amount: callServiceDto.requestBody[0].amount.amount,
        currencyCode: callServiceDto.requestBody[0].amount.currencyCode,
      },
    };
    const callbackErrorResponse = {
      thirdPartyTransId: callServiceDto.requestBody[0].thirdPartyTransId,
      mfsTransId: '1126231250437',
      e_trans_id: '11524180437',
      fxRate: 3720.765,
      status: {
        code: 'ER103',
        message: 'Mock error on callback',
      },
      receiveAmount: {
        amount: callServiceDto.requestBody[0].amount.amount,
        currencyCode: callServiceDto.requestBody[0].amount.currencyCode,
      },
    };

    const httpService = new HttpService();

    // Switch between mock scenarios
    let response = {};
    const url = `${EXTERNAL_API_ROOT}/${API_PATHS.onafriqCallback}`;
    if (mockScenario === MockScenario.success) {
      response = successStatus;
    } else if (mockScenario === MockScenario.errorOnCallback) {
      response = callbackErrorResponse;
    }

    await lastValueFrom(httpService.post(url, response)).catch((error) =>
      console.log(error),
    );
  }
}
