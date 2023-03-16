import { Injectable } from '@nestjs/common';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { BelcashTransferPayload } from './belcash-transfer-payload.dto';

@Injectable()
export class BelcashApiService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async authenticate(): Promise<string> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      token: process.env.BELCASH_API_TOKEN,
      // credentials: process.env.BELCASH_PASSWORD,
    };
    const url = `${process.env.BELCASH_API_URL}/authenticate`;
    const authenticationResult = await this.httpService.post<any>(url, payload);
    return authenticationResult.data.token;
  }

  public async transfer(
    payload: BelcashTransferPayload,
    authorizationToken?: string,
  ): Promise<any> {
    const headers = [
      { name: 'Authorization', value: `Bearer ${authorizationToken}` },
    ];
    return await this.httpService.post(
      `${process.env.BELCASH_API_URL}/transfers`,
      payload,
      headers,
    );
  }
}
