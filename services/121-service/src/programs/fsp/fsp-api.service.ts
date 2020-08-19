import { tap, map, catchError } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';
import { empty } from 'rxjs';
import { INTERSOLVE, AFRICASTALKING } from '../../secrets';

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

  public async sendPaymentIntersolve(fsp, payload): Promise<any> {
    const headersRequest = {
      accept: 'application/json',
      authorization: `Basic ${INTERSOLVE.authToken}`,
    };

    let error;
    const response = this.post(fsp.apiUrl, headersRequest, payload);
    return response
      ? { status: 'ok', message: response }
      : {
          status: 'error',
          message: { statusText: error.response.statusText },
        };
  }

  public async getBalance(): Promise<any> {
    const credentials = {
      apiKey: AFRICASTALKING.apiKey,
      username: AFRICASTALKING.username,
    };
    const AfricasTalking = require('africastalking')(credentials);
    const application = AfricasTalking.APPLICATION;

    let result;
    await application
      .fetchApplicationData()
      .then((response: any) => {
        console.log('response: ', response);
        result = { response: response };
      })
      .catch((error: any) => {
        // This catch is not working, also errors end up in the above response
        console.log('error: ', error);
        result = { error: error };
      });
    return result;
  }

  public async sendPaymentMpesa(payload): Promise<any> {
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
      ? { status: 'ok', message: result.response }
      : {
          status: 'error',
          message: { error: result.response },
        };
  }
}
