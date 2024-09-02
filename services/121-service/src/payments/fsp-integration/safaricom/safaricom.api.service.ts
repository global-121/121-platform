import {
  SafaricomAuthResponseDto,
  SafaricomTransferResponseDto,
} from '@121-service/src/payments/fsp-integration/safaricom/dto/safaricom-load-response.dto';
import { SafaricomTransferPayloadParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-payload.interface';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

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

      const { data } = await this.httpService.get<SafaricomAuthResponseDto>(
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
    }
  }

  public async transfer(payload: SafaricomTransferPayloadParams): Promise<any> {
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
        await this.httpService.post<SafaricomTransferResponseDto>(
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
}
