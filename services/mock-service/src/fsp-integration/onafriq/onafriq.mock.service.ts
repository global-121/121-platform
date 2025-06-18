import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import {
  OnafriqCallbackResponseBodyDto,
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
  constructor(private readonly httpService: HttpService) {}

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
      return this.createCallServiceResponseBody(
        MockScenario.errorOnRequest,
        callServiceDto.requestBody[0].thirdPartyTransId,
      );
    }

    const callServiceResponse = this.createCallServiceResponseBody(
      mockScenario,
      callServiceDto.requestBody[0].thirdPartyTransId,
    );

    this.sendStatusCallback(
      callServiceDto.requestBody[0].thirdPartyTransId,
      callServiceDto.requestBody[0].amount.amount,
      callServiceDto.requestBody[0].amount.currencyCode,
      mockScenario,
    ).catch((error) => console.log(error));

    return callServiceResponse;
  }

  private createCallServiceResponseBody(
    mockScenario: MockScenario,
    thirdPartyTransId: string,
  ): OnafriqCallServiceResponseBodyDto {
    return {
      totalTxSent: 1,
      noTxAccepted: mockScenario === MockScenario.errorOnRequest ? 0 : 1,
      noTxRejected: mockScenario === MockScenario.errorOnRequest ? 1 : 0,
      details: {
        transResponse: [
          {
            thirdPartyId: thirdPartyTransId,
            status: {
              code:
                mockScenario === MockScenario.errorOnRequest ? '101' : '100',
              message:
                mockScenario === MockScenario.errorOnRequest
                  ? 'Rejected'
                  : 'Accepted',
              messageDetail:
                mockScenario === MockScenario.errorOnRequest
                  ? 'Generic mock error on request'
                  : undefined,
            },
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async sendStatusCallback(
    thirdPartyTransId: string,
    amount: number,
    currencyCode: string,
    mockScenario: MockScenario.success | MockScenario.errorOnCallback,
  ): Promise<void> {
    await setTimeout(300);
    const successCallbackResponse = this.createCallbackResponse(
      mockScenario,
      thirdPartyTransId,
      amount,
      currencyCode,
    );
    const errorCallbackResponse = this.createCallbackResponse(
      mockScenario,
      thirdPartyTransId,
      amount,
      currencyCode,
    );

    // Switch between mock scenarios
    let response = {};
    const url = `${EXTERNAL_API_ROOT}/${API_PATHS.onafriqCallback}`;
    if (mockScenario === MockScenario.success) {
      response = successCallbackResponse;
    } else if (mockScenario === MockScenario.errorOnCallback) {
      response = errorCallbackResponse;
    }

    await lastValueFrom(this.httpService.post(url, response)).catch((error) =>
      console.log(error),
    );
  }

  private createCallbackResponse(
    mockScenario: MockScenario.success | MockScenario.errorOnCallback,
    thirdPartyTransId: string,
    amount: number,
    currencyCode: string,
  ): OnafriqCallbackResponseBodyDto {
    return {
      thirdPartyTransId,
      mfsTransId: '1126231250437',
      e_trans_id: '11524180437',
      fxRate: 3720.765,
      status: {
        code: mockScenario === MockScenario.success ? 'MR101' : 'ER103',
        message:
          mockScenario === MockScenario.success
            ? 'success'
            : 'Mock error on callback',
      },
      receiveAmount: {
        amount,
        currencyCode,
      },
    };
  }
}
