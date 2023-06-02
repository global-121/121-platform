import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SafaricomService {
  private readonly consumerKey: string = '3fZlPYA1RFQQ6eeGG1MXc4QxOqtUVPFY';
  private readonly consumerSecret: string = 'IMPDlynkPHWhg6ZS';
  private readonly accessTokenUrl: string = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

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
