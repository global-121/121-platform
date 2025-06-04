import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

import { AirtelApiDisbursementRequestDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-api-disbursement-request.dto';
import { AirtelDisbursementResponseDto } from '@121-service/src/payments/fsp-integration/airtel/dtos/airtel-disbursement-response.dto';
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

const getBooleanEnvDefaultToFalse = (envVar: string): boolean =>
  !!process.env[envVar];

const headersToPojo = (headers: Headers) => {
  const headersArray: { name: string; value: string }[] = [];
  headers.forEach((value, key) => {
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
    if (getBooleanEnvDefaultToFalse('mockAirtel')) {
      airtelApiBaseUrl = new URL(
        'api/fsp/airtel',
        getEnvOrThrow('MOCK_SERVICE_URL'),
      );
    } else {
      airtelApiBaseUrl = new URL(getEnvOrThrow('AIRTEL_API_URL'));
    }
    this.airtelAuthenticateURL = new URL('auth/oauth2/token', airtelApiBaseUrl);
    this.airtelDisbursementV2URL = new URL(
      'standard/v2/disbursements',
      airtelApiBaseUrl,
    );
    //
    this.airtelEnquiryV2URL = new URL('auth/oauth2/token', airtelApiBaseUrl);
    this.airtelEnquiryV2URL.searchParams.append('transactionType', 'B2C');
  }

  private addAuthHeaders(headers: Headers): Headers {
    if (!this.tokenSet || !this.tokenSet.access_token) {
      throw new Error('No access token available for Airtel API requests');
    }
    headers.append('Authorization', `Bearer ${this.tokenSet.access_token}`);
    return headers;
  }

  private async authenticate(): Promise<void> {
    if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
      return;
    }

    // Uses different headers from the other endpoints.
    const headers = new Headers();
    headers.append('Accept', '*/*');
    headers.append('Content-Type', 'application/json');

    const payload = {
      grant_type: 'client_credentials',
      client_id: this.airtelClientId,
      client_secret: this.airtelClientSecret,
    };

    let response;
    try {
      response = await this.httpService.post(
        `${this.airtelAuthenticateURL}`,
        payload,
        headersToPojo(headers),
      );
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

  public async disburse({
    idempotencyKey,
    encryptedPin,
    phoneNumber,
    currencyCode,
    countryCode,
    amount,
  }: {
    idempotencyKey: string;
    encryptedPin: string;
    phoneNumber: string;
    currencyCode: string;
    countryCode: string;
    amount: number;
  }): Promise<AirtelDisbursementResponseDto> {
    // Validate phone number here, we want to *not* send requests when the phone number is invalid.
    const zambianCountryCode = '260';
    const phoneNumberWithoutCountryCode = phoneNumber.slice(
      zambianCountryCode.length,
    );

    if (!(phoneNumberWithoutCountryCode.length === 9)) {
      throw new Error('does not have a valid phone number');
    }

    await this.authenticate();
    const url = this.airtelDisbursementV2URL;
    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
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
        id: idempotencyKey,
        type: 'B2C',
      },
    };

    let response;
    try {
      response = await this.httpService.post(
        url.href,
        payload,
        headersToPojo(headers),
      );
    } catch (error) {
      throw new AirtelApiError(`disbursement failed: ${error.message}`);
    }

    const responseCode = response?.data?.code;
    if (!responseCode) {
      console.error(response);
      throw new AirtelApiError(
        'disbursement failed: No response code received from Airtel API',
      );
    }

    return {
      result: AirtelDisbursementOrEnquiryResultMapper(responseCode),
      data: response?.data,
    };
  }

  public async enquire({
    idempotencyKey,
    countryCode,
    currencyCode,
  }: {
    idempotencyKey: string;
    countryCode: string;
    currencyCode: string;
  }): Promise<AirtelDisbursementResponseDto> {
    await this.authenticate();
    const url = new URL(idempotencyKey, this.airtelEnquiryV2URL);

    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
        'X-Country': countryCode,
        'X-Currency': currencyCode,
      }),
    );

    let response;
    try {
      response = await this.httpService.get(url.href, headersToPojo(headers));
    } catch (error) {
      throw new AirtelApiError(`enquiry failed: ${error.message}`);
    }

    const responseCode = response?.data?.code;
    if (!responseCode) {
      console.error(response);
      throw new AirtelApiError(
        'enquiry failed: No response code received from Airtel API',
      );
    }

    return {
      result: AirtelDisbursementOrEnquiryResultMapper(responseCode),
      data: response?.data,
    };
  }
}
