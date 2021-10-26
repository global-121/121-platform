import { HttpException, HttpService, Injectable } from '@nestjs/common';
import { FspName } from '../../../fsp/financial-service-provider.entity';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { PaTransactionResultDto } from '../../dto/payment-transaction-result.dto';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class BelcashApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async authenticate(): Promise<any> {
    const payload = {
      principal: process.env.BELCASH_LOGIN,
      system: process.env.BELCASH_SYSTEM,
      credentials: process.env.BELCASH_PASSWORD,
    };
    const authenticationResult = await this.post(`authenticate`, payload);
    const headers = {
      Authorization: `Bearer ${authenticationResult.data.token}`,
    };
    return headers;
  }

  public async transfer(payload: any, header?: any): Promise<any> {
    await this.post('transfers', payload, header);
  }

  private async post(
    endpoint: string,
    payload: any,
    header?: string,
  ): Promise<any> {
    return await this.httpService
      .post(`${process.env.BELCASH_API_URL}/${endpoint}`, payload, {
        headers: header,
      })
      .pipe(
        map(response => {
          console.log('response: ', response);
          return response;
        }),
        catchError(err => {
          return of(err.response);
        }),
      )
      .toPromise();
  }
}
