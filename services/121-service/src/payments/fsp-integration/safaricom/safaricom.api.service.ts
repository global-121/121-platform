import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import {
  SafaricomAuthResponseDto,
  SafaricomTransferResponseDto,
} from './dto/safaricom-load-response.dto';
import { SafaricomTransferPayload } from './dto/safaricom-transfer-payload.dto';

@Injectable()
export class SafaricomApiService {
  public tokenSet: TokenSet;

  public constructor(private readonly httpService: CustomHttpService) {}

  public async authenticate(): Promise<string> {
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = !!process.env.MOCK_SAFARICOM
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/authenticate`
      : `${process.env.SAFARICOM_API_URL}/oauth/v1/generate?grant_type=client_credentials`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    this.tokenSet = null;
    if (this.tokenSet && this.tokenSet.expires_at > Date.now()) {
      // Return cached token
      return this.tokenSet.access_token;
    } else {
      // If not valid, request new token
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
  }

  public async transfer(payload: SafaricomTransferPayload): Promise<any> {
    try {
      const paymentUrl = !!process.env.MOCK_SAFARICOM
        ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/transfer`
        : `${process.env.SAFARICOM_API_URL}/${process.env.SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT}`;
      const headers = [
        {
          name: 'Authorization',
          value: `Bearer ${this.tokenSet.access_token}`,
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
