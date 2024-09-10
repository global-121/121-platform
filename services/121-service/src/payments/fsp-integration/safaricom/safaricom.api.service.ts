import { TransferParams } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-params.interface';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomAuthResponseParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-auth-response.interface';
import {
  SafaricomTransferResponseBody,
  SafaricomTransferResponseParams,
} from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-response.interface';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-api.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

const safaricomApiUrl = process.env.MOCK_SAFARICOM
  ? process.env.MOCK_SERVICE_URL
  : process.env.SAFARICOM_API_URL;

const safaricomQueueTimeoutUrl = `${safaricomApiUrl}financial-service-providers/safaricom/timeout`;
const safaricomResultUrl = `${safaricomApiUrl}financial-service-providers/safaricom/callback`;

@Injectable()
export class SafaricomApiService {
  public tokenSet: TokenSet | null;

  public constructor(private readonly httpService: CustomHttpService) {}

  public async authenticate(): Promise<string | undefined> {
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = !!process.env.MOCK_SAFARICOM
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/authenticate`
      : `${process.env.SAFARICOM_API_URL}/oauth/v1/generate?grant_type=client_credentials`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    this.tokenSet = null;

    try {
      const headers = [{ name: 'Authorization', value: `Basic ${auth}` }];

      const { data } = await this.httpService.get<SafaricomAuthResponseParams>(
        `${accessTokenUrl}`,
        headers,
      );

      const datetime = new Date();
      // Cache tokenSet and expires_at
      const tokenSet = new TokenSet({
        access_token: data.access_token,
        expires_at: datetime.setMinutes(datetime.getMinutes() + 55),
      });

      this.tokenSet = tokenSet;

      return tokenSet.access_token;
    } catch (error) {
      console.log(error, 'authenticate');
      console.error('Failed to make OAuth Access Token payment API call');

      throw new SafaricomApiError(`Error: ${error.message}`);
    }
  }

  public async transfer(
    payload: TransferParams,
  ): Promise<SafaricomTransferResponseBody> {
    try {
      const paymentUrl = !!process.env.MOCK_SAFARICOM
        ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/transfer`
        : `${process.env.SAFARICOM_API_URL}/${process.env.SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT}`;
      const headers = [
        {
          name: 'Authorization',
          value: `Bearer ${this.tokenSet?.access_token}`,
        },
      ];

      const { data } =
        await this.httpService.post<SafaricomTransferResponseParams>(
          `${paymentUrl}`,
          payload,
          headers,
        );

      return data;
    } catch (error) {
      console.log(error, 'transfer');
      console.error('Failed to make Safaricom B2C payment API call');
      return error.response.data;
    }
  }

  public async sendTransfer(
    payload: TransferParams,
  ): Promise<SafaricomTransferResponseBody> {
    const result = await this.transfer(payload);

    if (result && result.ResponseCode !== '0') {
      throw new SafaricomApiError(result.ResponseDescription);
    }

    return result;
  }

  public createTransferPayload(transferData: DoTransferParams): TransferParams {
    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transferData.transferAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: transferData.phoneNumber, // Set to '25400000000' to trigger mock failure
      Remarks: transferData.remarks,
      QueueTimeOutURL: safaricomQueueTimeoutUrl,
      ResultURL: safaricomResultUrl,
      Occassion: transferData.occasion,
      OriginatorConversationID: transferData.originatorConversationId,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: transferData.idNumber,
    };
  }
}
