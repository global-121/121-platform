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
    const currentDate = new Date();
    const expireDate = new Date(process.env.SAFARICOM_EXPIRE_TOKEN_TIME);

    if (expireDate.getTime() / 1000 < currentDate.getTime() / 1000) {
      try {
        const { data } = await axios.get(`${accessTokenUrl}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        });
        console.log('Access Token: ' + data.access_token);
        const datetime = new Date();
        datetime.setHours(datetime.getHours() + 1);
        process.env.SAFARICOM_ACCESS_TOKEN = data.access_token;
        process.env.SAFARICOM_EXPIRE_TOKEN_TIME = new Date(datetime).toString();

        return data.access_token;
      } catch (error) {
        throw new Error('Failed to make OAuth Access Token payment API call');
      }
    } else {
      return process.env.SAFARICOM_ACCESS_TOKEN;
    }
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
