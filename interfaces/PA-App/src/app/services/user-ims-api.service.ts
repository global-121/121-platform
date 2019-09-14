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

  createCredentialRequest(wallet: JSON, correlation: JSON, credDefID: string, credentialOffer: JSON, did: string): Observable<any> {
    console.log('UserImsApiService : createCredentialRequest()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/credential/credreq',
        {
          wallet,
          correlation,
          credDefID,
          credentialOffer,
          did
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }

  storeCredential(credDefID: string, credentialRequestMetadata: any, credential: any, wallet: JSON, correlation: JSON): Observable<any> {
    console.log('UserImsApiService : storeCredential()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/credential/store',
        {
          credDefID,
          credentialRequestMetadata,
          credential,
          wallet,
          correlation,
        },
        true
      )
      .pipe(
        tap(response => console.log('response: ', response)),
        map(response => response)
      );
  }
}
