import { HttpService, Injectable } from '@nestjs/common';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { BelcashTransferPayload } from './belcash-transfer-payload.dto';

@Injectable()
export class BelcashApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async authenticate(): Promise<string> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      token: process.env.BELCASH_API_TOKEN,
    };
    const authenticationResult = await this.post(`authenticate`, payload);
    return authenticationResult.data.token;
  }

  public async transfer(
    payload: BelcashTransferPayload,
    authorizationToken?: string,
  ): Promise<any> {
    return await this.post('transfers', payload, authorizationToken);
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
