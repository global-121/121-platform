import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';

import { ApiService } from './api.service';
import { JwtService } from './jwt.service';

import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PaAccountApiService {
  constructor(private apiService: ApiService, private jwtService: JwtService) {}

  createAccount(username: string, password: string): Promise<User> {
    console.log('PaAccountApiService : createAccount()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user',
        {
          username,
          password,
        },
        true,
      )
      .pipe(
        map((response) => {
          const user = response.user;

          if (user && user.token) {
            this.jwtService.saveToken(user.token);
          }

          return user;
        }),
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
          data,
        },
        false,
      )
      .toPromise();
  }

  retrieve(type: string): Promise<any> {
    console.log('PaAccountApiService : retrieve()');

    return this.apiService
      .get(
        environment.url_pa_account_service_api,
        '/data-storage/' + type,
        false,
      )
      .pipe(
        catchError((error) => {
          if (error.error instanceof ErrorEvent) {
            // Client-side error:
            console.error(error);
          } else {
            // In case of server-side error (400/500):
            // Only on a 404-error, act as if nothing happened...
            if (error.status === 404) {
              return of(undefined);
            }
            // Otherwise...
            console.error(error);
            return of(error);
          }
        }),
      )
      .toPromise();
  }

  login(username: string, password: string): Promise<User> {
    console.log('PaAccountApiService : login()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user/login',
        {
          username,
          password,
        },
        true,
      )
      .pipe(
        map((response) => {
          const user = response.user;

          if (user && user.token) {
            this.jwtService.saveToken(user.token);
          }

          return user;
        }),
      )
      .toPromise();
  }

  setDid(did: string): Promise<any> {
    console.log('PaAccountApiService : setDid()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user/set-did',
        {
          did,
        },
        false,
      )
      .toPromise();
  }

  deleteAccount(password: string): Promise<any> {
    console.log('PaAccountApiService : deleteAccount()');

    return this.apiService
      .post(
        environment.url_pa_account_service_api,
        '/user/delete',
        {
          password,
        },
        false,
      )
      .toPromise();
  }
}
