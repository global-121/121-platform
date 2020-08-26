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
    return this.httpService
      .post(endcodedURI, payload, {
        headers: headers,
      })
      .pipe(
        tap(response =>
          console.log(`ApiService POST: ${url}`, `\nResponse:`, response),
        ),
        map(response => response.data),
        catchError(err => {
          console.log('err: ', err);
          return empty();
        }),
      )
      .toPromise();
  }

  public async sendPaymentIntersolve(apiUrl: string, payload): Promise<StatusMessageDto> {
    const headersRequest = {
      accept: 'application/json',
      authorization: `Basic ${INTERSOLVE.authToken}`,
    };

    let error;
    const response = await this.post(apiUrl, headersRequest, payload);
    return response
      ? { status: StatusEnum.succes, message: response }
      : {
          status: StatusEnum.error,
          message: { statusText: error.response.statusText },
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

    return !result.response.errorMessage &&
      !result.response.entries[0].errorMessage
      ? { status: StatusEnum.succes, message: result.response }
      : {
          status: StatusEnum.error,
          message: { error: result.response },
        };
  }
}
