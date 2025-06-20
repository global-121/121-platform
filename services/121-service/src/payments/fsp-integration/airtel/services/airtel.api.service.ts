import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { AirtelApiAuthenticationResponseDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-api-authentication-response.dto';
import { AirtelApiDisbursementRequestDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-api-disbursement-request.dto';
import { AirtelDisbursementOrEnquiryResponseDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-disbursement-or-enquiry-response.dto';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelApiError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel-api.error';
import { AirtelDisbursementOrEnquiryResultMapper } from '@121-service/src/payments/fsp-integration/airtel/mappers/airtel-disbursement-or-enquiry-result.mapper';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

// ## TODO: when the branch for better handling of environment variables is merged, use that pattern.
const getEnvOrThrow = (envVar: string): string => {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(
      `Tried to get environment variable "${envVar}" but it is not set or is empty.`,
    );
  }
  return value;
};

const getBooleanEnvDefaultToFalse = (envVar: string): boolean => {
  const value = process.env[envVar];
  if (!value) return false;
  if (value.toLowerCase() === 'false') return false;
  return true;
};

// ##TODO: We should refactor the use of Headers in the custom HTTP service and than this function can be removed.
const headersToPojo = (headers: Headers) => {
  const headersArray: { name: string; value: string }[] = [];
  headers.forEach((value, key) => {
    key = key[0].toUpperCase() + key.slice(1); // Capitalize the first letter of the header name
    headersArray.push({ name: key, value });
  });
  return headersArray;
};

@Injectable()
export class AirtelApiService {
  private tokenSet: TokenSet;
  private readonly airtelClientId: string;
  private readonly airtelClientSecret: string;
  private readonly airtelAuthenticateURL: URL;
  private readonly airtelDisbursementV2URL: URL;
  private readonly airtelEnquiryV2URL: URL;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
  ) {
    this.airtelClientId = getEnvOrThrow('AIRTEL_CLIENT_ID');
    this.airtelClientSecret = getEnvOrThrow('AIRTEL_CLIENT_SECRET');

    let airtelApiBaseUrl: URL;
    if (getBooleanEnvDefaultToFalse('MOCK_AIRTEL')) {
      airtelApiBaseUrl = new URL(
        'api/fsp/airtel/',
        getEnvOrThrow('MOCK_SERVICE_URL'),
      );
    } else {
      airtelApiBaseUrl = new URL(getEnvOrThrow('AIRTEL_API_URL'));
    }
    this.airtelAuthenticateURL = new URL('auth/oauth2/token', airtelApiBaseUrl);
    this.airtelDisbursementV2URL = new URL(
      'standard/v2/disbursements/',
      airtelApiBaseUrl,
    );
    // ## TODO: can it just be the same?
    this.airtelEnquiryV2URL = new URL(
      'standard/v2/disbursements/',
      airtelApiBaseUrl,
    );
  }

  public async disburse({
    airtelTransactionId,
    encryptedPin,
    phoneNumberWithoutCountryCode,
    currencyCode,
    countryCode,
    amount,
  }: {
    airtelTransactionId: string;
    encryptedPin: string;
    phoneNumberWithoutCountryCode: string;
    currencyCode: string;
    countryCode: string;
    amount: number;
  }): Promise<{
    result: AirtelDisbursementResultEnum;
    message: string;
  }> {
    await this.authenticate();
    const url = this.airtelDisbursementV2URL;
    const headers = this.addAuthHeaders(
      new Headers({
        'Content-Type': 'application/json',
        'X-Country': countryCode,
        'X-Currency': currencyCode,
      }),
    );

    const payload: AirtelApiDisbursementRequestDto = {
      payee: {
        currency: currencyCode,
        msisdn: phoneNumberWithoutCountryCode,
      },
      // The docs say "Reference for service / goods purchased."
      // We can just use a static non-relevant value here. Needs to be alphanumeric and 4 - 64 characters long.
      reference: '1234',
      pin: encryptedPin,
      transaction: {
        amount,
        id: airtelTransactionId,
        type: 'B2C',
      },
    };

    let response: AxiosResponse<AirtelDisbursementOrEnquiryResponseDto>;
    try {
      // We don't actually validate that the API returns this.
      // We'll add actual validation later.
      response = await this.httpService.post<
        AxiosResponse<AirtelDisbursementOrEnquiryResponseDto>
      >(url.href, payload, headersToPojo(headers));
    } catch (error) {
      throw new AirtelApiError(
        `disbursement failed, could not complete request: ${error.message}`,
      );
    }

    return {
      result: this.getResultFromResponseCode(
        response.data?.status?.response_code,
      ),
      message: this.getMessage(response.data),
    };
  }

  public async enquire({
    airtelTransactionId,
    countryCode,
    currencyCode,
  }: {
    airtelTransactionId: string;
    countryCode: string;
    currencyCode: string;
  }): Promise<{
    result:
      | AirtelDisbursementResultEnum.success
      | AirtelDisbursementResultEnum.fail;
    message: string;
  }> {
    await this.authenticate();
    const url = new URL(airtelTransactionId, this.airtelEnquiryV2URL);
    url.searchParams.append('transactionType', 'B2C');
    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
        'Content-Type': 'application/json',
        'X-Country': countryCode,
        'X-Currency': currencyCode,
      }),
    );

    let response: AxiosResponse<AirtelDisbursementOrEnquiryResponseDto>;
    try {
      // We don't actually validate that the API returns this.
      // ##TODO: add actual validation later.
      response = await this.httpService.get<
        AxiosResponse<AirtelDisbursementOrEnquiryResponseDto>
      >(url.href, headersToPojo(headers));
    } catch (error) {
      throw new AirtelApiError(
        `enquire failed, could not complete request: ${error.message}`,
      );
    }

    return {
      // The result of enquiry cannot be duplicate.
      result: this.getResultFromResponseCode(
        response.data?.status?.response_code,
      ) as
        | AirtelDisbursementResultEnum.fail
        | AirtelDisbursementResultEnum.success,
      message: this.getMessage(response.data),
    };
  }

  // ##TODO: Refactore: Do not call both addAuthHeader and authenticate in enquire and disburse methods.
  private addAuthHeaders(headers: Headers): Headers {
    if (!this.tokenSet || !this.tokenSet.access_token) {
      throw new Error('No access token available for Airtel API requests');
    }
    // ##TODO: Uncomment this when the token validation service is implemented with ms as param

    headers.append('Authorization', `Bearer ${this.tokenSet.access_token}`);
    return headers;
  }

  // ##TODO: Refactore: Do not call both addAuthHeader and authenticate in enquire and disburse methods.
  private async authenticate(): Promise<void> {
    // if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
    //   console.log(
    //     'Airtel API token is still valid, no need to authenticate again.',
    //   );
    //   return;
    // }

    // Uses different headers from the other endpoints.
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const payload = {
      grant_type: 'client_credentials',
      client_id: this.airtelClientId,
      client_secret: this.airtelClientSecret,
    };

    let response;
    try {
      // We don't actually validate that the API returns this.
      // ##TODO: add actual validation later.
      response = await this.httpService.post<
        AxiosResponse<AirtelApiAuthenticationResponseDto>
      >(`${this.airtelAuthenticateURL}`, payload, headersToPojo(headers));
    } catch (error) {
      throw new AirtelApiError(`authentication failed: ${error.message}`);
    }

    // ## TODO: Validate using the DTO.
    const accessToken = response?.data?.access_token;
    if (!accessToken) {
      throw new AirtelApiError(
        'authentication failed: No access token received from Airtel API',
      );
    }
    const expiresInSeconds = response?.data?.expires_in;

    if (!expiresInSeconds || expiresInSeconds <= 0) {
      throw new AirtelApiError(
        `authentication failed: Invalid or missing expires_in value from Airtel API: "${expiresInSeconds}".`,
      );
    }

    // We subtract 5 seconds to ensure we don't use an expired token.
    const expiresAtUnixTimestamp = (expiresInSeconds - 5) * 1000 + Date.now();

    this.tokenSet = new TokenSet({
      access_token: accessToken,
      expires_at: expiresAtUnixTimestamp,
    });
  }

  private getMessage(data: AirtelDisbursementOrEnquiryResponseDto): string {
    const responseCode = data?.status?.response_code;

    let message = '';

    if (data?.status?.message) {
      message = `${data.status.message} (${responseCode})`;
    } else {
      // Put whatever is in data as a string.
      // This is a fallback in case the message is not structured as expected.
      message = JSON.stringify(data);
    }
    return message;
  }

  private getResultFromResponseCode(
    responseCode: AirtelDisbursementResultEnum | undefined,
  ): AirtelDisbursementResultEnum {
    if (!responseCode) {
      throw new AirtelApiError(
        'disbursement failed: No response code received from Airtel API',
      );
    }
    return AirtelDisbursementOrEnquiryResultMapper(responseCode);
  }
}
