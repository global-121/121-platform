import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

import { AuthResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/auth-response-safaricom-api.dto';
import { TransferRequestSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-request-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { TransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/transfer-return-type.interface';
import { SafaricomApiHelperService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Injectable()
export class SafaricomApiService {
  private tokenSet: TokenSet;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly tokenValidationService: TokenValidationService,
    private readonly safaricomApiHelperService: SafaricomApiHelperService,
  ) {}

  public async transfer({
    transferAmount,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }: {
    transferAmount: number;
    phoneNumber: string;
    idNumber: string;
    originatorConversationId: string;
  }): Promise<TransferReturnType> {
    const payload = this.safaricomApiHelperService.createTransferPayload({
      transferAmount,
      phoneNumber,
      idNumber,
      originatorConversationId,
    });
    const transferResponse = await this.makeTransferCall(payload);

    const errorMessage =
      this.safaricomApiHelperService.createErrorMessageIfApplicable(
        transferResponse,
        originatorConversationId,
      );

    if (errorMessage) {
      throw new SafaricomApiError(errorMessage);
    }

    return {
      mpesaConversationId: transferResponse.data.ConversationID,
    };
  }

  private async authenticate(): Promise<void> {
    if (this.tokenValidationService.isTokenValid(this.tokenSet)) {
      return;
    }

    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = !!process.env.MOCK_SAFARICOM
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/authenticate`
      : `${process.env.SAFARICOM_API_URL}/oauth/v1/generate?grant_type=client_credentials`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    try {
      const headers = [{ name: 'Authorization', value: `Basic ${auth}` }];

      const { data } = await this.httpService.get<AuthResponseSafaricomApiDto>(
        `${accessTokenUrl}`,
        headers,
      );

      // Cache tokenSet and expires_at
      const tokenSet = new TokenSet({
        access_token: data.access_token,
        expires_at: (data.expires_in - 5 * 60) * 1000 + Date.now(), //expires_in is typically 3599, so in seconds and 1 hour from now. We subtract 5 minutes to be safe.
      });
      this.tokenSet = tokenSet;
    } catch (error) {
      console.error(
        'Failed to make OAuth Access Token payment API call',
        error,
      );
      throw new SafaricomApiError(`Error: ${error.message}`);
    }
  }

  private async makeTransferCall(
    payload: TransferRequestSafaricomApiDto,
  ): Promise<TransferResponseSafaricomApiDto> {
    try {
      await this.authenticate();

      const paymentUrl = !!process.env.MOCK_SAFARICOM
        ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/transfer`
        : `${process.env.SAFARICOM_API_URL}/${process.env.SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT}`;

      const headers = [
        {
          name: 'Authorization',
          value: `Bearer ${this.tokenSet.access_token}`,
        },
      ];

      return await this.httpService.post<TransferResponseSafaricomApiDto>(
        `${paymentUrl}`,
        payload,
        headers,
      );
    } catch (error) {
      console.error('Failed to make Safaricom B2C payment API call', error);
      throw new SafaricomApiError(`Error: ${error.message}`);
    }
  }
}
