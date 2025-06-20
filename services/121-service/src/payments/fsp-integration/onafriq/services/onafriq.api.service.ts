import { Injectable } from '@nestjs/common';
import * as https from 'https';

import { DEBUG, EXTERNAL_API } from '@121-service/src/config';
import { CallServiceRequestOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-request-onafriq-api.dto';
import { CallServiceResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-response-onafriq-api.dto';
import { WebhookSubscribeResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/webhook-subscribe-response-onafriq-api.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
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
    // Adding this was needed to get past an UNABLE_TO_GET_ISSUER_CERT_LOCALLY error. Create a custom HTTPS agent that ignores certificate errors
    // ##TODO: Figure out what is needed for production
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
  }

  public async subscribeWebhook(): Promise<
    WebhookSubscribeResponseOnafriqApiDto | undefined
  > {
    if (process.env.MOCK_ONAFRIQ) {
      return; // No need to subscribe to webhook in mock mode
    }

    const webhookSubscribeUrl = `${onafriqApiUrl}/api/webhook/subscribe`; // ##TODO check if it is OK to always use /subscribe instead of /update. Both seem to always work.
    const payload = {
      corporateCode: process.env.ONAFRIQ_CORPORATE_CODE,
      callbackUrl: `${EXTERNAL_API.baseApiUrl}financial-service-providers/onafriq/callback`,
    };
    const headers = [
      {
        name: 'password',
        value: process.env.ONAFRIQ_PASSWORD,
      },
    ];

    const { status, statusText, data } =
      await this.httpService.post<WebhookSubscribeResponseOnafriqApiDto>(
        webhookSubscribeUrl,
        payload,
        headers,
        DEBUG ? this.httpsAgent : undefined, // Use the custom HTTPS agent only in debug mode
      );
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
  }): Promise<{
    status: OnafriqApiResponseStatusType;
    errorMessage?: string;
  }> {
    const payload = this.onafriqApiHelperService.createCallServicePayload({
      transferAmount,
      phoneNumber,
      firstName,
      lastName,
      thirdPartyTransId,
    });
    const callServiceResponse = await this.makeCallServiceCall(payload);

    return this.onafriqApiHelperService.processCallServiceResponse(
      callServiceResponse,
    );
  }

  private async makeCallServiceCall(
    payload: CallServiceRequestOnafriqApiDto,
  ): Promise<CallServiceResponseOnafriqApiDto> {
    try {
      const callServiceUrl = `${onafriqApiUrl}/callService`;

      return await this.httpService.post<CallServiceResponseOnafriqApiDto>(
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
  }
}
