import { Injectable } from '@nestjs/common';
import * as https from 'https';

import { DEBUG, EXTERNAL_API } from '@121-service/src/config';
import { OnafriqApiCallServiceRequestBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-call-service-request-body.dto';
import { OnafriqApiCallServiceResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-call-service-response-body.dto';
import { OnafriqApiWebhookSubscribeResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-webhook-subscribe-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { CallServiceResult } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/call-service-result.interface.';
import { OnafriqApiHelperService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const onafriqApiUrl = !!process.env.MOCK_ONAFRIQ
  ? `${process.env.MOCK_SERVICE_URL}api/fsp/onafriq`
  : `${process.env.ONAFRIQ_API_URL}hub/async`;

@Injectable()
export class OnafriqApiService {
  private readonly httpsAgent: https.Agent;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly onafriqApiHelperService: OnafriqApiHelperService,
  ) {
    // NOTE: Adding this was needed to get past an UNABLE_TO_GET_ISSUER_CERT_LOCALLY error on sandbox API. Create a custom HTTPS agent that ignores certificate errors
    // For now, do not use this on production, but first test there without this work-around. If needed, we can add it to production as well.
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  public async subscribeWebhook(): Promise<
    OnafriqApiWebhookSubscribeResponseBody | undefined
  > {
    if (process.env.MOCK_ONAFRIQ) {
      return; // No need to subscribe to webhook in mock mode
    }

    const webhookSubscribeUrl = `${onafriqApiUrl}/api/webhook/subscribe`;
    const payload = {
      corporateCode: process.env.ONAFRIQ_CORPORATE_CODE,
      callbackUrl: `${EXTERNAL_API.baseApiUrl}fsps/onafriq/callback`,
    };
    const headers = [
      {
        name: 'password',
        value: process.env.ONAFRIQ_PASSWORD,
      },
    ];

    let { status, statusText, data } =
      await this.httpService.post<OnafriqApiWebhookSubscribeResponseBody>(
        webhookSubscribeUrl,
        payload,
        headers,
        DEBUG ? this.httpsAgent : undefined, // Use the custom HTTPS agent only in debug mode
      );
    if (status !== 200 || data?.message !== 'Success') {
      return { status, statusText, data };
    }

    // NOTE: it is unclear if /subscribe or /update is needed, so the safest approach is to use both (unless the first failed already). In terms of payload and response they are identical.
    const webhookUpdateUrl = `${onafriqApiUrl}/api/webhook/update`;
    ({ status, statusText, data } =
      await this.httpService.post<OnafriqApiWebhookSubscribeResponseBody>(
        webhookUpdateUrl,
        payload,
        headers,
        DEBUG ? this.httpsAgent : undefined, // Use the custom HTTPS agent only in debug mode
      ));
    return { status, statusText, data };
  }

  // NOTE: this method-name aligns exactly with the name of the endpoint in the Onafriq API
  public async callService({
    transferAmount,
    phoneNumber,
    firstName,
    lastName,
    thirdPartyTransId,
  }: {
    transferAmount: number;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    thirdPartyTransId: string;
  }): Promise<CallServiceResult> {
    const payload = this.onafriqApiHelperService.createCallServicePayload({
      transferAmount,
      phoneNumber,
      firstName,
      lastName,
      thirdPartyTransId,
    });
    const callServiceResponse =
      await this.makeCallServiceCallAndValidateResponse(payload);

    return this.onafriqApiHelperService.processCallServiceResponse(
      callServiceResponse,
    );
  }

  private async makeCallServiceCallAndValidateResponse(
    payload: OnafriqApiCallServiceRequestBody,
  ): Promise<OnafriqApiCallServiceResponseBody> {
    let response: unknown;
    try {
      const callServiceUrl = `${onafriqApiUrl}/callService`;
      response = await this.httpService.post<unknown>(
        callServiceUrl,
        payload,
        undefined, // headers,
        DEBUG ? this.httpsAgent : undefined, // Use the custom HTTPS agent only in debug mode
      );
    } catch (error) {
      console.error('Failed to make Onafriq callService API call', error);
      throw new OnafriqError(
        `Error: ${error.message}`,
        OnafriqApiResponseStatusType.genericError,
      );
    }

    if (
      !this.onafriqApiHelperService.isOnafriqApiCallServiceResponseBody(
        response,
      )
    ) {
      const errorMessage = `Error: Invalid Onafriq API response structure. ${this.onafriqApiHelperService.serializeErrorResponseData(response)}`;
      throw new OnafriqError(
        errorMessage,
        OnafriqApiResponseStatusType.genericError,
      );
    }
    return response;
  }
}
