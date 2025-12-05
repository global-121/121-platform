import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { env } from '@121-service/src/env';
import { CooperativeBankOfOromiaApiAuthenticationRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-request-body.dto';
import { CooperativeBankOfOromiaApiAuthenticationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-authentication-response-body.dto';
import { CooperativeBankOfOromiaApiPaymentResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-payment-response-body.dto';
import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiError } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.api.error';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { headersToPojo } from '@121-service/src/utils/headers-to-pojo/headers-to-pojo';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Injectable()
export class CooperativeBankOfOromiaApiService {
  private tokenSet: TokenSet;
  private readonly cooperativeBankOfOromiaTransferURL: URL;
  private readonly cooperativeBankOfOromiaAuthenticateURL: URL;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
    private readonly cooperativeBankOfOromiaApiHelperService: CooperativeBankOfOromiaApiHelperService,
  ) {
    const transferUrlPart = 'nrc/1.0.0/transfer'; // This path is the same on UAT and Production
    if (env.MOCK_COOPERATIVE_BANK_OF_OROMIA) {
      this.cooperativeBankOfOromiaTransferURL = new URL(
        `api/fsp/cooperative-bank-of-oromia/${transferUrlPart}`,
        env.MOCK_SERVICE_URL,
      );
    } else if (!env.COOPERATIVE_BANK_OF_OROMIA_API_URL) {
      throw new Error('COOPERATIVE_BANK_OF_OROMIA_API_URL is not set');
    } else {
      this.cooperativeBankOfOromiaTransferURL = new URL(
        transferUrlPart,
        env.COOPERATIVE_BANK_OF_OROMIA_API_URL,
      );
    }

    // Set auth base url; this is a different api path
    let authUrlBase: URL;
    if (
      env.MOCK_COOPERATIVE_BANK_OF_OROMIA ||
      !env.COOPERATIVE_BANK_OF_OROMIA_AUTH_URL
    ) {
      authUrlBase = new URL(
        'api/fsp/cooperative-bank-of-oromia/',
        env.MOCK_SERVICE_URL,
      );
    } else {
      authUrlBase = new URL(env.COOPERATIVE_BANK_OF_OROMIA_AUTH_URL);
    }
    const urlPart = 'oauth2/token';
    this.cooperativeBankOfOromiaAuthenticateURL = new URL(urlPart, authUrlBase);
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

    const headers = new Headers({
      Accept: '*/*',
      'Content-Type': 'application/json',
    });
    headers.append('Authorization', `Bearer ${tokenSet.access_token}`);

    const payload: CooperativeBankOfOromiaApiTransferRequestBodyDto =
      this.cooperativeBankOfOromiaApiHelperService.buildTransferPayload({
        cooperativeBankOfOromiaMessageId,
        recipientCreditAccountNumber,
        debitAccountNumber,
        amount,
      });

    let response: AxiosResponse<CooperativeBankOfOromiaApiPaymentResponseBodyDto>;

    try {
      response = await this.httpService.post<
        AxiosResponse<CooperativeBankOfOromiaApiPaymentResponseBodyDto>
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

  private async authenticate(): Promise<TokenSet> {
    // Return cached token if still valid
    if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
      return this.tokenSet;
    }

    // Uses different headers from the other endpoints.
    const headers = new Headers({
      Accept: '*/*',
      'Content-Type': 'application/json',
    });
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
}
