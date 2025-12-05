import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { env } from '@121-service/src/env';
import { AirtelApiAuthenticationRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/airtel/dtos/airtel-api-authentication-request-body.dto';
import { AirtelApiAuthenticationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/airtel/dtos/airtel-api-authentication-response-body.dto';
import { AirtelApiDisbursementRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/airtel/dtos/airtel-api-disbursement-request-body.dto';
import { AirtelApiRequestTypeEnum } from '@121-service/src/fsp-integrations/integrations/airtel/enums/airtel-api-request-type.enum';
import { AirtelDisbursementResultEnum } from '@121-service/src/fsp-integrations/integrations/airtel/enums/airtel-disbursement-result.enum';
import { AirtelApiError } from '@121-service/src/fsp-integrations/integrations/airtel/errors/airtel-api.error';
import { AirtelApiHelperService } from '@121-service/src/fsp-integrations/integrations/airtel/services/airtel.api.helper.service';
import { AirtelEncryptionService } from '@121-service/src/fsp-integrations/integrations/airtel/services/airtel.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class AirtelApiService {
  private readonly encryptedPin: string;
  private tokenSet: TokenSet;
  private readonly airtelClientId: string | undefined;
  private readonly airtelClientSecret: string | undefined;
  private readonly countryCode: string;
  private readonly currencyCode: string;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly airtelEncryptionService: AirtelEncryptionService,
    private readonly airtelApiHelperService: AirtelApiHelperService,
  ) {
    const airtelDisbursementPin = env.AIRTEL_DISBURSEMENT_PIN;
    const airtelDisbursementV1PinEncryptionPublicKey =
      env.AIRTEL_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY;

    // No need to re-encrypt the same value for every request.
    if (airtelDisbursementPin && airtelDisbursementV1PinEncryptionPublicKey) {
      this.encryptedPin = this.airtelEncryptionService.encryptPinV1(
        airtelDisbursementPin,
        airtelDisbursementV1PinEncryptionPublicKey,
      );
    }

    this.airtelClientId = env.AIRTEL_CLIENT_ID;
    this.airtelClientSecret = env.AIRTEL_CLIENT_SECRET;

    this.countryCode = 'ZM';
    this.currencyCode = 'ZMW';
  }

  private getAirtelApiBaseUrl(): URL {
    if (env.MOCK_AIRTEL) {
      return new URL('api/fsp/airtel/', env.MOCK_SERVICE_URL);
    } else if (!env.AIRTEL_API_URL) {
      throw new Error('AIRTEL_API_URL is not set');
    } else {
      return new URL(env.AIRTEL_API_URL);
    }
  }

  private getAirtelDisbursementAndEnquiryV2URL(): URL {
    return new URL('standard/v2/disbursements/', this.getAirtelApiBaseUrl());
  }

  private getAirtelAuthenticateURL(): URL {
    return new URL('auth/oauth2/token', this.getAirtelApiBaseUrl());
  }

  public async disburse({
    airtelTransactionId,
    phoneNumberWithoutCountryCode,
    amount,
  }: {
    airtelTransactionId: string;
    phoneNumberWithoutCountryCode: string;
    amount: number;
  }): Promise<{
    result: AirtelDisbursementResultEnum;
    message: string;
  }> {
    await this.authenticate();
    const url = this.getAirtelDisbursementAndEnquiryV2URL();
    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
        'Content-Type': 'application/json',
        'X-Country': this.countryCode,
        'X-Currency': this.currencyCode,
      }),
    );

    const payload: AirtelApiDisbursementRequestBodyDto = {
      payee: {
        currency: this.currencyCode,
        msisdn: phoneNumberWithoutCountryCode,
      },
      // The docs say "Reference for service / goods purchased."
      // We can just use a static non-relevant value here. Needs to be alphanumeric and 4 - 64 characters long.
      reference: '1234',
      pin: this.encryptedPin,
      transaction: {
        amount,
        id: airtelTransactionId,
        type: 'B2C',
      },
    };

    return await this.makeRequestAndParseResponseOrThrow({
      url,
      payload,
      headers,
      requestType: AirtelApiRequestTypeEnum.disburse,
    });
  }

  public async enquire({
    airtelTransactionId,
  }: {
    airtelTransactionId: string;
  }): Promise<{
    result:
      | AirtelDisbursementResultEnum.success
      | AirtelDisbursementResultEnum.fail;
    message: string;
  }> {
    await this.authenticate();
    const url = new URL(
      airtelTransactionId,
      this.getAirtelDisbursementAndEnquiryV2URL(),
    );
    url.searchParams.append('transactionType', 'B2C');
    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
        'Content-Type': 'application/json',
        'X-Country': this.countryCode,
        'X-Currency': this.currencyCode,
      }),
    );

    const parsedResponse = await this.makeRequestAndParseResponseOrThrow({
      url,
      headers,
      requestType: AirtelApiRequestTypeEnum.enquire,
    });

    // We unpack parsedResponse here so the return type is correct.
    return {
      // The result of enquiry cannot be duplicate.
      result: parsedResponse.result as
        | AirtelDisbursementResultEnum.fail
        | AirtelDisbursementResultEnum.success,
      message: parsedResponse.message,
    };
  }

  private addAuthHeaders(headers: Headers): Headers {
    if (!this.tokenSet || !this.tokenSet.access_token) {
      throw new Error('No access token available for Airtel API requests');
    }
    // Refactor: make token validation service use ms as param.
    headers.append('Authorization', `Bearer ${this.tokenSet.access_token}`);
    return headers;
  }

  private async authenticate(): Promise<void> {
    // Uses different headers from the other endpoints.
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const payload: AirtelApiAuthenticationRequestBodyDto = {
      grant_type: 'client_credentials',
      client_id: this.airtelClientId,
      client_secret: this.airtelClientSecret,
    };

    let response;
    try {
      // We don't actually validate that the API returns this.
      // Refactor: add validation.
      response = await this.httpService.post<
        AxiosResponse<AirtelApiAuthenticationResponseBodyDto>
      >(this.getAirtelAuthenticateURL().href, payload, headers);
    } catch (error) {
      throw new AirtelApiError(`authentication failed: ${error.message}`);
    }

    // If secrets are invalid we get this specific response.
    if ('error' in response && 'error_description' in response) {
      throw new AirtelApiError(
        `authentication failed: ${response.error} - ${response.error_description}`,
      );
    }

    // Refactor: add validation.
    const accessToken = response?.data?.access_token;
    const expiresInSeconds = response?.data?.expires_in;

    if (!accessToken || !expiresInSeconds || expiresInSeconds <= 0) {
      // Unlikely to go wrong, so bad ROI in throwing more specific errors.
      throw new AirtelApiError(
        'authentication failed: unclear response from Airtel API',
      );
    }

    // We subtract 5 seconds to ensure we don't use an expired token.
    const expiresAtUnixTimestamp = (expiresInSeconds - 5) * 1000 + Date.now();

    this.tokenSet = new TokenSet({
      access_token: accessToken,
      expires_at: expiresAtUnixTimestamp,
    });
  }

  private async makeRequestAndParseResponseOrThrow({
    url,
    payload,
    headers,
    requestType,
  }: {
    url: URL;
    payload?: AirtelApiDisbursementRequestBodyDto;
    headers: Headers;
    requestType: AirtelApiRequestTypeEnum;
  }): Promise<{
    result: AirtelDisbursementResultEnum;
    message: string;
  }> {
    // Tell TypeScript that response will certainly be defined after the try/catch.
    let response!: AxiosResponse<unknown>;

    // try/catch around this whole branch is less code
    try {
      // Refactor when we have easier exhaustiveness checking.
      if (requestType === AirtelApiRequestTypeEnum.disburse) {
        response = await this.httpService.post<AxiosResponse<unknown>>(
          url.href,
          payload,
          headers,
        );
      } else if (requestType === AirtelApiRequestTypeEnum.enquire) {
        response = await this.httpService.get<AxiosResponse<unknown>>(
          url.href,
          headers,
        );
      }
    } catch (error) {
      console.error('Airtel API call failed', error);
      throw new AirtelApiError(
        `${requestType} failed, could not complete request: ${error.message}`,
      );
    }

    let potentialResponseCode: string | undefined;

    if (
      this.airtelApiHelperService.isAirtelDisbursementOrEnquiryResponseBodyDto(
        response.data,
      )
    ) {
      potentialResponseCode = response.data.status?.response_code;
      const result =
        this.airtelApiHelperService.getDisbursementResultForResponseCode(
          potentialResponseCode,
        );
      return {
        result,
        message: `${response.data.status.message} (${potentialResponseCode})`,
      };
    }

    // If we get here, the response is not the expected Airtel API response. However, we still want to return a result
    // So this an unexpected response is still shown to the user.
    const result =
      this.airtelApiHelperService.getDisbursementResultForResponseCode(
        potentialResponseCode,
      );
    return {
      result,
      message: JSON.stringify(response.data),
    };
  }
}
