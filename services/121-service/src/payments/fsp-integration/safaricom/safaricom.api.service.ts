import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

import { AuthResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/auth-response-safaricom-api.dto';
import { TransferRequestSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-request-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { DuplicateOriginatorConversationIdError } from '@121-service/src/payments/fsp-integration/safaricom/errors/duplicate-originator-conversation-id.error';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { TransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/transfer-return-type.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const callbackBaseUrl = process.env.EXTERNAL_121_SERVICE_URL + 'api/';
const safaricomTimeoutCallbackUrl = `${callbackBaseUrl}financial-service-providers/safaricom/timeout-callback`;
const safaricomTransferCallbacktUrl = `${callbackBaseUrl}financial-service-providers/safaricom/transfer-callback`;

@Injectable()
export class SafaricomApiService {
  public tokenSet: TokenSet;

  public constructor(private readonly httpService: CustomHttpService) {}

  public async transfer({
    transferAmount,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }): Promise<TransferReturnType> {
    const payload = this.createTransferPayload({
      transferAmount,
      phoneNumber,
      idNumber,
      originatorConversationId,
    });
    const transferResponse = await this.makeTransferCall(payload);

    let errorMessage: string | undefined;

    if (!transferResponse || !transferResponse.data) {
      errorMessage = `Error: No response data from Safaricom API`;
    } else if (transferResponse.data.errorCode) {
      if (transferResponse.data.errorCode === '500.002.1001') {
        // This happens only in case of unintended Redis job re-attempt, and only if the API-request already went through the first time
        // Return custom error, as it should be handled differently than other errors
        const duplicateOriginatorConversationIdErrorMessage = `Error: ${transferResponse.data.errorMessage} for originatorConversationId ${originatorConversationId}`;
        throw new DuplicateOriginatorConversationIdError(
          duplicateOriginatorConversationIdErrorMessage,
        );
      }
      errorMessage = `${transferResponse.data.errorCode} - ${transferResponse.data.errorMessage}`;
    } else if (!transferResponse.data.ResponseCode) {
      errorMessage = `Error: ${transferResponse.data?.statusCode} ${transferResponse.data?.error}`;
    } else if (transferResponse.data.ResponseCode !== '0') {
      errorMessage = `Response: ${transferResponse.data?.ResponseCode} - ${transferResponse.data?.ResponseDescription}`;
    }

    if (errorMessage) {
      throw new SafaricomApiError(errorMessage);
    }

    // All the checks above mean that at this stage transferResponse.data.ResponseCode === '0'
    return {
      mpesaConversationId: transferResponse.data.ConversationID,
    };
  }

  private async authenticate(): Promise<void> {
    if (this.isTokenValid(this.tokenSet)) {
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

  private createTransferPayload({
    transferAmount,
    phoneNumber,
    idNumber,
    originatorConversationId,
  }): TransferRequestSafaricomApiDto {
    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transferAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: phoneNumber,
      Remarks: 'No remarks', // Not used for reconciliation by clients. Required to be non-empty, so filled with default value.
      QueueTimeOutURL: safaricomTimeoutCallbackUrl,
      ResultURL: safaricomTransferCallbacktUrl,
      OriginatorConversationID: originatorConversationId,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: idNumber,
    };
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

  private isTokenValid(
    tokenSet: TokenSet,
  ): tokenSet is TokenSet & Required<Pick<TokenSet, 'access_token'>> {
    if (!tokenSet || !tokenSet.expires_at) {
      return false;
    }
    const timeLeftBeforeExpire = tokenSet.expires_at - Date.now();
    // We set a buffer of 5 minutes to make sure that when doing the subsequent POST call, the token is still valid.
    return timeLeftBeforeExpire > 5 * 60 * 1000;
  }

  public testIsTokenValid(tokenSet: TokenSet): boolean {
    return this.isTokenValid(tokenSet);
  }
}
