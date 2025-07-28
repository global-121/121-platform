import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { setTimeout } from 'node:timers/promises';
import { lastValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { API_PATHS, EXTERNAL_API_ROOT } from '@mock-service/src/config';
import {
  OnafriqCallbackResponseBodyDto,
  OnafriqCallServicePayload,
  OnafriqCallServiceResponseBodyDto,
} from '@mock-service/src/fsp-integration/onafriq/onafriq.dto';

enum MockScenario {
  success = 'success',
  errorOnRequestGeneric = 'error-on-request-generic',
  errorOnRequestDuplicateThirdPartyTransId = 'error-on-request-duplicate-third-party-trans-id',
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
      mockScenario = MockScenario.errorOnRequestGeneric;
    } else if (
      callServiceDto.requestBody[0].recipient.msisdn === '24300000001'
    ) {
      mockScenario = MockScenario.errorOnRequestDuplicateThirdPartyTransId;
    } else if (
      callServiceDto.requestBody[0].recipient.msisdn === '24300000002'
    ) {
      mockScenario = MockScenario.errorOnCallback;
    }

    if (
      mockScenario === MockScenario.errorOnRequestGeneric ||
      mockScenario === MockScenario.errorOnRequestDuplicateThirdPartyTransId
    ) {
      return this.createCallServiceResponseBody(
        mockScenario,
        callServiceDto.requestBody[0].thirdPartyTransId,
      );
    }

    const callServiceResponse = this.createCallServiceResponseBody(
      mockScenario,
      callServiceDto.requestBody[0].thirdPartyTransId,
    );

    this.sendStatusCallback(
      callServiceDto.requestBody[0].thirdPartyTransId,
      mockScenario,
    ).catch((error) => console.log(error));

    return callServiceResponse;
  }

  private createCallServiceResponseBody(
    mockScenario: MockScenario,
    thirdPartyTransId: string,
  ): OnafriqCallServiceResponseBodyDto {
    const isGenericError = mockScenario === MockScenario.errorOnRequestGeneric;
    const isDuplicateError =
      mockScenario === MockScenario.errorOnRequestDuplicateThirdPartyTransId;
    const status = {
      code: isGenericError ? '101' : '100',
      message: isGenericError ? 'Rejected' : 'Accepted',
      messageDetail: isGenericError
        ? 'Generic mock error on request'
        : isDuplicateError
          ? 'Transaction already exist with given ThirdParty'
          : undefined,
    };

    return {
      totalTxSent: 1,
      noTxAccepted: isGenericError ? 0 : 1,
      noTxRejected: isGenericError ? 1 : 0,
      details: {
        transResponse: [
          {
            thirdPartyId: thirdPartyTransId,
            status,
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async sendStatusCallback(
    thirdPartyTransId: string,
    mockScenario: MockScenario.success | MockScenario.errorOnCallback,
  ): Promise<void> {
    await setTimeout(300);
    const successCallbackResponse = this.createCallbackResponse(
      mockScenario,
      thirdPartyTransId,
    );
    const errorCallbackResponse = this.createCallbackResponse(
      mockScenario,
      thirdPartyTransId,
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
  ): OnafriqCallbackResponseBodyDto {
    return {
      thirdPartyTransId,
      mfsTransId: `mock-${uuid()}`, // Mock MFS transaction ID
      status: {
        code: mockScenario === MockScenario.success ? 'MR101' : 'ER103',
        message:
          mockScenario === MockScenario.success
            ? 'success'
            : 'Mock error on callback',
      },
    };
  }
}
