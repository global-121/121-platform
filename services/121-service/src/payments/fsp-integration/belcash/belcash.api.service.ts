import { HttpException, HttpService, Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class BelcashApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async authenticate(): Promise<string> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      credentials: process.env.BELCASH_PASSWORD,
    };
    const authenticationResult = await this.post(`authenticate`, payload);
    console.log('authenticationResult: ', authenticationResult);
    return authenticationResult.data.token;
  }

  public async transfer(
    payload: any,
    authorizationToken?: string,
  ): Promise<any> {
    await this.post('transfers', payload, authorizationToken);
  }

  private async post(
    endpoint: string,
    payload: any,
    authorizationToken?: string,
  ): Promise<any> {
    //const url = 'https://httpbin.org/post';
    const url = '`${process.env.BELCASH_API_URL}/${endpoint}`';
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
