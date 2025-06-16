import { Injectable } from '@nestjs/common';
import * as https from 'https';

import { DEBUG } from '@121-service/src/config';
import { CallServiceRequestOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-request-onafriq-api.dto';
import { CallServiceResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-response-onafriq-api.dto';
import { OnafriqApiError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq-api.error';
import { OnafriqApiHelperService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class OnafriqApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly onafriqApiHelperService: OnafriqApiHelperService,
  ) {}

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
  }): Promise<void> {
    const payload = this.onafriqApiHelperService.createCallServicePayload({
      transferAmount,
      phoneNumber,
      firstName,
      lastName,
      thirdPartyTransId,
    });
    const callServiceResponse = await this.makeCallServiceCall(payload);

    const errorMessage =
      this.onafriqApiHelperService.createErrorMessageIfApplicable(
        callServiceResponse,
        thirdPartyTransId,
      );

    if (errorMessage) {
      throw new OnafriqApiError(errorMessage);
    }

    return;
  }

  private async makeCallServiceCall(
    payload: CallServiceRequestOnafriqApiDto,
  ): Promise<CallServiceResponseOnafriqApiDto> {
    try {
      // ##TODO: it seems for now that no separate authenticate step is needed
      // await this.authenticate();

      const callServiceUrl = !!process.env.MOCK_ONAFRIQ
        ? `${process.env.MOCK_SERVICE_URL}api/fsp/onafriq/callService`
        : `${process.env.ONAFRIQ_API_URL}hub/async/callService`;

      // ##TODO: probably not needed
      // const headers = [
      //   {
      //     name: 'Authorization',
      //     value: `Bearer xxx`,
      //   },
      // ];

      // Adding this was needed to get past an UNABLE_TO_GET_ISSUER_CERT_LOCALLY error. Create a custom HTTPS agent that ignores certificate errors
      // ##TODO: Figure out what is needed for production
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      });
      return await this.httpService.post<CallServiceResponseOnafriqApiDto>(
        `${callServiceUrl}`,
        payload,
        undefined, // headers,
        DEBUG ? httpsAgent : undefined, // Use the custom HTTPS agent only in debug mode
      );
    } catch (error) {
      console.error('Failed to make Onafriq callService API call', error);
      throw new OnafriqApiError(`Error: ${error.message}`);
    }
  }
}
