import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class PaAccountApiService {
  constructor(
    private apiService: ApiService,
    private jwtService: JwtService,
  ) { }

  createAccount(username: string, password: string): Promise<any> {
    console.log('PaAccountApiService : createAccount()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user',
        {
          username,
          password
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => {
          const user = response.user;

          if (user && user.token) {
            this.jwtService.saveToken(user.token);
          }
        })
      )
      .toPromise();
  }

  store(type: string, data: string): Promise<any> {
    console.log('PaAccountApiService : store()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/data-storage',
        {
          type,
          data
        },
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  retrieve(type: string): Promise<any> {
    console.log('PaAccountApiService : retrieve()');

    return this.apiService
      .get(
        environment.url_pa_account_service_api,
        '/data-storage/' + type,
        false
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      )
      .toPromise();
  }

  login(username: string, password: string): Promise<any> {
    console.log('PaAccountApiService : login()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user/login',
        {
          username,
          password
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => {
          const user = response.user;

          if (user && user.token) {
            this.jwtService.saveToken(user.token);
          }
        })
      )
      .toPromise();
  }
}
