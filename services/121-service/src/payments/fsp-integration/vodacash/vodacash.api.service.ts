import { HttpService, Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { VodacashTransferPayload } from './vodacash-transfer-payload.dto';
import { MockToken, MockTransfer } from './mock/vodacash-mock';

@Injectable()
export class VodacashApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async authenticate(): Promise<string> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      token: process.env.BELCASH_API_TOKEN,
      // credentials: process.env.BELCASH_PASSWORD,
    };
    const authenticationResult = !!process.env.MOCK_VODACASH
      ? JSON.parse(JSON.stringify(MockToken))
      : await this.post(`authenticate`, payload);
    return authenticationResult.data.token;
  }

  public async transfer(
    payload: VodacashTransferPayload,
    authorizationToken?: string,
  ): Promise<any> {
    const result = !!process.env.MOCK_VODACASH
      ? JSON.parse(JSON.stringify(MockTransfer))
      : await this.post(`transfers`, payload, authorizationToken);
    return result;
  }

  private async post(
    endpoint: string,
    payload: any,
    authorizationToken?: string,
  ): Promise<any> {
    const url = `${process.env.BELCASH_API_URL}/${endpoint}`;
    return await this.httpService
      .post(url, payload, {
        headers: this.createHeaders(authorizationToken),
      })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(err => {
          return of(err.response);
        }),
      )
      .toPromise();
  }

  private createHeaders(authorizationToken?: string): object {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authorizationToken) {
      headers['Authorization'] = `Bearer ${authorizationToken}`;
    }
    return headers;
  }
}
