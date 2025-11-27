import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaApiAccountValidationResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-account-validation-response-body.dto';
import { CooperativeBankOfOromiaApiAuthenticationRequestBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-request-body.dto';
import { CooperativeBankOfOromiaApiAuthenticationResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-response-body.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaApiTransferResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.api.error';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { headersToPojo } from '@121-service/src/utils/headers-to-pojo/headers-to-pojo';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Injectable()
export class CooperativeBankOfOromiaApiService {
  private tokenSet: TokenSet;
  private readonly cooperativeBankOfOromiaTransferURL: URL;
  private readonly cooperativeBankOfOromiaAuthenticateURL: URL;
  private readonly cooperativeBankOfOromiaAccountValidationURL: URL;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
    private readonly cooperativeBankOfOromiaApiHelperService: CooperativeBankOfOromiaApiHelperService,
  ) {
    const transferUrlPart = 'nrc/1.0.0/transfer'; // This path is the same on UAT and Production
    const accountValidationUrlPart = 'nrc/1.0.0/accountValidation';

    this.cooperativeBankOfOromiaTransferURL = this.buildApiUrl({
      baseUrl: env.COOPERATIVE_BANK_OF_OROMIA_API_URL,
      mockServiceUrl: env.MOCK_SERVICE_URL,
      urlPart: transferUrlPart,
    });

    this.cooperativeBankOfOromiaAccountValidationURL = this.buildApiUrl({
      baseUrl: env.COOPERATIVE_BANK_OF_OROMIA_API_URL,
      mockServiceUrl: env.MOCK_SERVICE_URL,
      urlPart: accountValidationUrlPart,
    });

    // Set auth base url; this is a different api url
    this.cooperativeBankOfOromiaAuthenticateURL = this.buildApiUrl({
      baseUrl: env.COOPERATIVE_BANK_OF_OROMIA_AUTH_URL,
      mockServiceUrl: env.MOCK_SERVICE_URL,
      urlPart: 'oauth2/token',
    });
  }

  private buildApiUrl({
    baseUrl,
    mockServiceUrl,
    urlPart,
  }: {
    baseUrl: string | undefined;
    mockServiceUrl: string;
    urlPart: string;
  }): URL {
    const mockFlag = env.MOCK_COOPERATIVE_BANK_OF_OROMIA;
    const mockPathPrefix = 'api/fsp/cooperative-bank-of-oromia/';
    if (mockFlag || !baseUrl) {
      return new URL(`${mockPathPrefix}${urlPart}`, mockServiceUrl);
    }
    return new URL(urlPart, baseUrl);
  }

  public async initiateTransfer({
    cooperativeBankOfOromiaMessageId,
    recipientCreditAccountNumber,
    debitAccountNumber,
    amount,
  }: {
    cooperativeBankOfOromiaMessageId: string;
    recipientCreditAccountNumber: string;
    debitAccountNumber: string;
    amount: number;
  }): Promise<{
    result: CooperativeBankOfOromiaTransferResultEnum;
    message?: string;
  }> {
    let tokenSet: TokenSet;
    try {
      tokenSet = await this.authenticate();
    } catch (error) {
      if (error instanceof CooperativeBankOfOromiaApiError) {
        return {
          result: CooperativeBankOfOromiaTransferResultEnum.fail,
          message: error.message,
        };
      } else {
        throw error;
      }
    }

    const headers = this.createHeaderWithBearerToken(tokenSet.access_token);

    const payload: CooperativeBankOfOromiaApiTransferRequestBodyDto =
      this.cooperativeBankOfOromiaApiHelperService.buildTransferPayload({
        cooperativeBankOfOromiaMessageId,
        recipientCreditAccountNumber,
        debitAccountNumber,
        amount,
      });

    let response: AxiosResponse<CooperativeBankOfOromiaApiTransferResponseBodyDto>;

    try {
      response = await this.httpService.post<
        AxiosResponse<CooperativeBankOfOromiaApiTransferResponseBodyDto>
      >(
        this.cooperativeBankOfOromiaTransferURL.href,
        payload,
        headersToPojo(headers),
      );
    } catch (error) {
      return {
        result: CooperativeBankOfOromiaTransferResultEnum.fail,
        message: `Transfer failed: ${error.message}`,
      };
    }

    return this.cooperativeBankOfOromiaApiHelperService.handleTransferResponse(
      response.data,
    );
  }

  public async validateAccount(accountNumber: string): Promise<{
    cooperativeBankOfOromiaName?: string;
    errorMessage?: string;
  }> {
    let tokenSet: TokenSet;
    try {
      tokenSet = await this.authenticate();
    } catch (error) {
      if (error instanceof CooperativeBankOfOromiaApiError) {
        return {
          errorMessage: error.message,
        };
      } else {
        throw error;
      }
    }
    const headers = this.createHeaderWithBearerToken(tokenSet.access_token);

    const payload = { accountNumber };

    let response: AxiosResponse<CooperativeBankOfOromiaApiAccountValidationResponseBodyDto>;

    try {
      response = await this.httpService.post<
        AxiosResponse<CooperativeBankOfOromiaApiAccountValidationResponseBodyDto>
      >(
        this.cooperativeBankOfOromiaAccountValidationURL.href,
        payload,
        headersToPojo(headers),
      );
    } catch (error) {
      return {
        errorMessage: `Account validation error: ${error.message}, HTTP Status: ${error.status}`,
      };
    }
    return this.cooperativeBankOfOromiaApiHelperService.handleAccountValidationResponse(
      response.data,
    );
  }

  private async authenticate(): Promise<TokenSet> {
    // Return cached token if still valid
    if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
      return this.tokenSet;
    }

    // Uses different headers from the other endpoints.
    const headers = this.createDefaultHeaders();
    headers.append(
      'Authorization',
      `Basic ${env.COOPERATIVE_BANK_OF_OROMIA_BASE64_CREDENTIALS}`,
    );

    const payload: CooperativeBankOfOromiaApiAuthenticationRequestBodyDto = {
      grant_type: 'client_credentials',
    };

    let response: AxiosResponse<CooperativeBankOfOromiaApiAuthenticationResponseBodyDto>;
    try {
      response = await this.httpService.post<
        AxiosResponse<CooperativeBankOfOromiaApiAuthenticationResponseBodyDto>
      >(
        this.cooperativeBankOfOromiaAuthenticateURL.href,
        payload,
        headersToPojo(headers),
      );
    } catch (error) {
      // This error is not something we expect to happen (e.g. network error)
      throw new CooperativeBankOfOromiaApiError(
        `authentication failed: ${error.message}, http code: ${error.status}`,
      );
    }

    const responseData = response.data;
    // If secrets are invalid we get this specific response.
    if ('error' in responseData || 'error_description' in responseData) {
      throw new CooperativeBankOfOromiaApiError(
        `authentication failed: ${responseData.error} - ${responseData.error_description}`,
      );
    }

    const accessToken = responseData?.access_token;
    const expiresInSeconds = responseData?.expires_in;

    if (!accessToken || !expiresInSeconds || expiresInSeconds <= 0) {
      // Unlikely to go wrong, so bad ROI in throwing more specific errors.
      throw new CooperativeBankOfOromiaApiError(
        'authentication failed: unclear response from CooperativeBankOfOromia API',
      );
    }
    const expiresAtUnixTimestamp = expiresInSeconds * 1000 + Date.now();

    this.tokenSet = new TokenSet({
      access_token: accessToken,
      expires_at: expiresAtUnixTimestamp,
    });

    return this.tokenSet;
  }

  private createDefaultHeaders(): Headers {
    return new Headers({
      Accept: '*/*',
      'Content-Type': 'application/json',
    });
  }

  // Token is possibly undefined because TokenSet type has optional access_token
  // but in our case it will always be defined after authenticate() butts can't infer that.
  private createHeaderWithBearerToken(token?: string): Headers {
    const headers = this.createDefaultHeaders();
    headers.append('Authorization', `Bearer ${token}`);
    return headers;
  }
}
