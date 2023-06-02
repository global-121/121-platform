import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SafaricomService {
  private readonly consumerKey: string = process.env.SAFARICOM_CONSUMER_KEY;
  private readonly consumerSecret: string = process.env.SAFARICOM_CONSUMER_SECRET;
  private readonly accessTokenUrl: string = process.env.SAFARICOM_CONSUMER_ACCESS_TOKEN_URL + '/oauth/v1/generate?grant_type=client_credentials';

  public async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

    const { data } = await axios.get(this.accessTokenUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    });

    return data.access_token;
  }
}
