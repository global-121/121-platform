import { StatusEnum } from './../../shared/enum/status.enum';
import { tap, map, catchError } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';
import { empty } from 'rxjs';
import { INTERSOLVE, AFRICASTALKING } from '../../secrets';
import { StatusMessageDto } from '../../shared/dto/status-message.dto';

@Injectable()
export class FspApiService {
  public constructor(private readonly httpService: HttpService) {}

  private async post(url: string, headers: any, payload: any): Promise<any> {
    const endcodedURI = encodeURI(url);
    let result;
    await this.httpService
      .post(endcodedURI, payload, {
        headers: headers,
      })
      .pipe(
        tap(response => {
          console.log(`ApiService POST: ${url}`, `\nResponse:`, response);
          result = { response: response };
        }),
        map(response => response.data),
        catchError(err => {
          console.log('err: ', err);
          result = { error: err };
          return empty();
        }),
      )
      .toPromise();
    return result;
  }

  public async sendPaymentIntersolve(
    apiUrl: string,
    payload,
  ): Promise<StatusMessageDto> {
    const headersRequest = {
      accept: 'application/json',
      authorization: `Basic ${INTERSOLVE.authToken}`,
    };

    const result = await this.post(apiUrl, headersRequest, payload);
    return result.response
      ? { status: StatusEnum.success, message: result.response }
      : {
          status: StatusEnum.error,
          message: { error: result.error.response.statusText },
        };
  }

  public async sendPaymentMpesa(payload): Promise<StatusMessageDto> {
    const credentials = {
      apiKey: AFRICASTALKING.apiKey,
      username: AFRICASTALKING.username,
    };
    const AfricasTalking = require('africastalking')(credentials);
    const payments = AfricasTalking.PAYMENTS;

    let result;
    await payments
      .mobileB2C(payload)
      .then((response: any) => {
        console.log('response: ', response);
        result = { response: response };
      })
      .catch((error: any) => {
        // This catch is not working, also errors end up in the above response
        console.log('error: ', error);
        result = { error: error };
      });

    if (result.error) {
      return { status: StatusEnum.error, message: { error: result.error } };
    } else if (result.response.errorMessage) {
      return {
        status: StatusEnum.error,
        message: { error: result.response.errorMessage },
      };
    } else {
      return { status: StatusEnum.success, message: result.response };
    }
  }
}
