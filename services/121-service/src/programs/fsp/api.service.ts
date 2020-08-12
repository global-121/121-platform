import { tap, map, catchError } from 'rxjs/operators';
import { Injectable, HttpService } from '@nestjs/common';
import { empty } from 'rxjs';

@Injectable()
export class ApiService {
  public constructor(private readonly httpService: HttpService) {}

  public async post(url: string, headers: any, payload: any): Promise<any> {
    const endcodedURI = encodeURI(url);
    return this.httpService
      .post(endcodedURI, payload, {
        headers: headers,
      })
      .pipe(
        tap(response =>
          console.log(`ApiService GET: ${url}`, `\nResponse:`, response),
        ),
        map(response => response.data),
        catchError(err => {
          console.log('err: ', err);
          return empty();
        }),
      )
      .toPromise();
  }
}
