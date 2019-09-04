import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserImsApiService {
  constructor(
    private apiService: ApiService
  ) { }

  createWallet(wallet: JSON, correlation: JSON): Observable<any> {
    console.log('UserImsApiService : createWallet()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/wallet',
        {
          wallet,
          correlation
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }

  createStoreDid(wallet: JSON, correlation: JSON): Observable<any> {
    console.log('UserImsApiService : createStoreDid()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/did',
        {
          wallet,
          correlation
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }
}
