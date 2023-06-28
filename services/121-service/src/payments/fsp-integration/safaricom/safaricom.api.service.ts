import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CustomHttpService } from '../../../shared/services/custom-http.service';

@Injectable()
export class SafaricomApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async authenticate(): Promise<string> {
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    const { data } = await axios.get(`${accessTokenUrl}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });
    console.log('Access Token: ' + data.access_token);
    return data.access_token;
  }

  public async transfer(payload: any, authorizationToken?): Promise<any> {
    try {
      const paymentUrl = process.env.SAFARICOM_B2C_PAYMENTREQUEST_URL;
      const response = await axios.post(paymentUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorizationToken}`,
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to make Safaricom B2C payment API call');
    }
  }
}
