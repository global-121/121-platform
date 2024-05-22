import { BelcashTransferPayload } from '@121-service/src/payments/fsp-integration/belcash/belcash-transfer-payload.dto';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { Injectable } from '@nestjs/common';

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
