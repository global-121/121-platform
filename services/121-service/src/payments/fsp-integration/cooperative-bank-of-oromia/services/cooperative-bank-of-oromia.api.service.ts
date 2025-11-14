import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaApiAuthenticationRequestBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-request-body.dto';
import { CooperativeBankOfOromiaApiAuthenticationResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-response-body.dto';
import { CooperativeBankOfOromiaApiDisbursementRequestBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-disbursement-request-body.dto';
import { CooperativeBankOfOromiaApiRequestTypeEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-api-request-type.enum';
import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia-api.error';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CooperativeBankOfOromiaEncryptionService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

// Remove when we use Headers in the custom HTTP service.
const headersToPojo = (headers: Headers) => {
  const headersArray: { name: string; value: string }[] = [];
  headers.forEach((value, key) => {
    key = key[0].toUpperCase() + key.slice(1); // Capitalize the first letter of the header name
    headersArray.push({ name: key, value });
  });
  return headersArray;
};

@Injectable()
export class CooperativeBankOfOromiaApiService {
  private readonly encryptedPin: string;
  private tokenSet: TokenSet;
  private readonly cooperativeBankOfOromiaClientId: string | undefined;
  private readonly cooperativeBankOfOromiaClientSecret: string | undefined;
  private readonly countryCode: string;
  private readonly currencyCode: string;
  private readonly cooperativeBankOfOromiaAuthenticateURL: URL;
  private readonly cooperativeBankOfOromiaDisbursementAndEnquiryV2URL: URL;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly cooperativeBankOfOromiaEncryptionService: CooperativeBankOfOromiaEncryptionService,
    private readonly cooperativeBankOfOromiaApiHelperService: CooperativeBankOfOromiaApiHelperService,
  ) {
    const cooperativeBankOfOromiaDisbursementPin = env.COOPERATIVE_BANK_OF_OROMIA_DISBURSEMENT_PIN;
    const cooperativeBankOfOromiaDisbursementV1PinEncryptionPublicKey =
      env.COOPERATIVE_BANK_OF_OROMIA_DISBURSEMENT_V1_PIN_ENCRYPTION_PUBLIC_KEY;

    // No need to re-encrypt the same value for every request.
    if (cooperativeBankOfOromiaDisbursementPin && cooperativeBankOfOromiaDisbursementV1PinEncryptionPublicKey) {
      this.encryptedPin = this.cooperativeBankOfOromiaEncryptionService.encryptPinV1(
        cooperativeBankOfOromiaDisbursementPin,
        cooperativeBankOfOromiaDisbursementV1PinEncryptionPublicKey,
      );
    }

    this.cooperativeBankOfOromiaClientId = env.COOPERATIVE_BANK_OF_OROMIA_CLIENT_ID;
    this.cooperativeBankOfOromiaClientSecret = env.COOPERATIVE_BANK_OF_OROMIA_CLIENT_SECRET;

    this.countryCode = 'ZM';
    this.currencyCode = 'ZMW';

    let cooperativeBankOfOromiaApiBaseUrl: URL;
    if (env.MOCK_COOPERATIVE_BANK_OF_OROMIA || !env.COOPERATIVE_BANK_OF_OROMIA_API_URL) {
      cooperativeBankOfOromiaApiBaseUrl = new URL('api/fsp/cooperative-bank-of-oromia/', env.MOCK_SERVICE_URL);
    } else {
      cooperativeBankOfOromiaApiBaseUrl = new URL(env.COOPERATIVE_BANK_OF_OROMIA_API_URL);
    }
    this.cooperativeBankOfOromiaAuthenticateURL = new URL('auth/oauth2/token', cooperativeBankOfOromiaApiBaseUrl);
    this.cooperativeBankOfOromiaDisbursementAndEnquiryV2URL = new URL(
      'standard/v2/disbursements/',
      cooperativeBankOfOromiaApiBaseUrl,
    );
  }

  public async disburse({
    cooperativeBankOfOromiaTransactionId,
    phoneNumberWithoutCountryCode,
    amount,
  }: {
    cooperativeBankOfOromiaTransactionId: string;
    phoneNumberWithoutCountryCode: string;
    amount: number;
  }): Promise<{
    result: CooperativeBankOfOromiaDisbursementResultEnum;
    message: string;
  }> {
    await this.authenticate();
    const url = this.cooperativeBankOfOromiaDisbursementAndEnquiryV2URL;
    const headers = this.addAuthHeaders(
      new Headers({
        Accept: '*/*',
        'Content-Type': 'application/json',
        'X-Country': this.countryCode,
        'X-Currency': this.currencyCode,
      }),
    );

    const payload: CooperativeBankOfOromiaApiDisbursementRequestBodyDto = {
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
        id: cooperativeBankOfOromiaTransactionId,
        type: 'B2C',
      },
    };

    return await this.makeRequestAndParseResponseOrThrow({
      url,
      payload,
      headers,
      requestType: CooperativeBankOfOromiaApiRequestTypeEnum.disburse,
    });
  }

  public async enquire({
    cooperativeBankOfOromiaTransactionId,
  }: {
    cooperativeBankOfOromiaTransactionId: string;
  }): Promise<{
    result:
      | CooperativeBankOfOromiaDisbursementResultEnum.success
      | CooperativeBankOfOromiaDisbursementResultEnum.fail;
    message: string;
  }> {
    await this.authenticate();
    const url = new URL(
      cooperativeBankOfOromiaTransactionId,
      this.cooperativeBankOfOromiaDisbursementAndEnquiryV2URL,
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
      requestType: CooperativeBankOfOromiaApiRequestTypeEnum.enquire,
    });

    // We unpack parsedResponse here so the return type is correct.
    return {
      // The result of enquiry cannot be duplicate.
      result: parsedResponse.result as
        | CooperativeBankOfOromiaDisbursementResultEnum.fail
        | CooperativeBankOfOromiaDisbursementResultEnum.success,
      message: parsedResponse.message,
    };
  }

  private addAuthHeaders(headers: Headers): Headers {
    if (!this.tokenSet || !this.tokenSet.access_token) {
      throw new Error('No access token available for CooperativeBankOfOromia API requests');
    }
    // Refactor: make token validation service use ms as param.
    headers.append('Authorization', `Bearer ${this.tokenSet.access_token}`);
    return headers;
  }

  private async authenticate(): Promise<void> {
    // Uses different headers from the other endpoints.
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const payload: CooperativeBankOfOromiaApiAuthenticationRequestBodyDto = {
      grant_type: 'client_credentials',
      client_id: this.cooperativeBankOfOromiaClientId,
      client_secret: this.cooperativeBankOfOromiaClientSecret,
    };

    let response;
    try {
      // We don't actually validate that the API returns this.
      // Refactor: add validation.
      response = await this.httpService.post<
        AxiosResponse<CooperativeBankOfOromiaApiAuthenticationResponseBodyDto>
      >(this.cooperativeBankOfOromiaAuthenticateURL.href, payload, headersToPojo(headers));
    } catch (error) {
      throw new CooperativeBankOfOromiaApiError(`authentication failed: ${error.message}`);
    }

    // If secrets are invalid we get this specific response.
    if ('error' in response && 'error_description' in response) {
      throw new CooperativeBankOfOromiaApiError(
        `authentication failed: ${response.error} - ${response.error_description}`,
      );
    }

    // Refactor: add validation.
    const accessToken = response?.data?.access_token;
    const expiresInSeconds = response?.data?.expires_in;

    if (!accessToken || !expiresInSeconds || expiresInSeconds <= 0) {
      // Unlikely to go wrong, so bad ROI in throwing more specific errors.
      throw new CooperativeBankOfOromiaApiError(
        'authentication failed: unclear response from CooperativeBankOfOromia API',
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
    payload?: CooperativeBankOfOromiaApiDisbursementRequestBodyDto;
    headers: Headers;
    requestType: CooperativeBankOfOromiaApiRequestTypeEnum;
  }): Promise<{
    result: CooperativeBankOfOromiaDisbursementResultEnum;
    message: string;
  }> {
    // Tell TypeScript that response will certainly be defined after the try/catch.
    let response!: AxiosResponse<unknown>;

    // try/catch around this whole branch is less code
    try {
      // Refactor when we have easier exhaustiveness checking.
      if (requestType === CooperativeBankOfOromiaApiRequestTypeEnum.disburse) {
        response = await this.httpService.post<AxiosResponse<unknown>>(
          url.href,
          payload,
          headersToPojo(headers),
        );
      } else if (requestType === CooperativeBankOfOromiaApiRequestTypeEnum.enquire) {
        response = await this.httpService.get<AxiosResponse<unknown>>(
          url.href,
          headersToPojo(headers),
        );
      }
    } catch (error) {
      console.error('CooperativeBankOfOromia API call failed', error);
      throw new CooperativeBankOfOromiaApiError(
        `${requestType} failed, could not complete request: ${error.message}`,
      );
    }

    let potentialResponseCode: string | undefined;

    if (
      this.cooperativeBankOfOromiaApiHelperService.isAirtelDisbursementOrEnquiryResponseBodyDto(
        response.data,
      )
    ) {
      potentialResponseCode = response.data.status?.response_code;
      const result =
        this.cooperativeBankOfOromiaApiHelperService.getDisbursementResultForResponseCode(
          potentialResponseCode,
        );
      return {
        result,
        message: `${response.data.status.message} (${potentialResponseCode})`,
      };
    }

    // If we get here, the response is not the expected CooperativeBankOfOromia API response. However, we still want to return a result
    // So this an unexpected response is still shown to the user.
    const result =
      this.cooperativeBankOfOromiaApiHelperService.getDisbursementResultForResponseCode(
        potentialResponseCode,
      );
    return {
      result,
      message: JSON.stringify(response.data),
    };
  }
}
