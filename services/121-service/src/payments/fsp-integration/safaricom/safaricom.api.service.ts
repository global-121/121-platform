import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { CustomHttpService } from '../../../shared/services/custom-http.service';

@Injectable()
export class SafaricomApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async makePayment(payload: any): Promise<any> {
    try {
      const paymentUrl = process.env.SAFARICOM_B2C_PAYMENTREQUEST_URL;
      const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
      const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
      const accessToken = await this.getAccessToken(consumerKey, consumerSecret);
      const response = await axios.post(paymentUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to make Safaricom B2C payment API call');
    }
  }

  // Function to trigger Safaricom Authentication API call
  public async getAuthenticationToken(): Promise<string> {
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const { data } = await axios.get(`${accessTokenUrl}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      });
      console.log("Access Token: " + data.access_token);
      return data.access_token;
    } catch (error) {
      // Handle error appropriately
      throw new Error('Failed to retrieve access token from Safaricom Authentication API');
    }
  }
  async getAccessToken(consumerKey: string, consumerSecret: string): Promise<string> {
    const accessTokenUrl = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const { data } = await axios.get(accessTokenUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    return data.access_token;
  }
}
