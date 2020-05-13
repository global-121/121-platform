import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

import { ApiService } from './api.service';

class Wallet {
  id: string;
  passKey: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserImsApiService {
  // Some endpoints require this object as a parameter
  private correlation = {
    correlationID: 'test',
  };

  constructor(private apiService: ApiService) {}

  createWallet(wallet: Wallet): Promise<any> {
    console.log('UserImsApiService : createWallet()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/wallet',
        {
          wallet,
          correlation: this.correlation,
        },
        true,
      )
      .toPromise();
  }

  createStoreDid(wallet: Wallet): Promise<any> {
    console.log('UserImsApiService : createStoreDid()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/did',
        {
          wallet,
          correlation: this.correlation,
        },
        true,
      )
      .toPromise();
  }

  createCredentialRequest(
    wallet: Wallet,
    credDefID: string,
    credentialOffer: JSON,
    did: string,
  ): Promise<any> {
    console.log('UserImsApiService : createCredentialRequest()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/credential/credreq',
        {
          wallet,
          correlation: this.correlation,
          credDefID,
          credentialOffer,
          did,
        },
        true,
      )
      .toPromise();
  }

  storeCredential(
    credDefID: string,
    credentialRequestMetadata: any,
    credential: any,
    wallet: Wallet,
  ): Promise<any> {
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
          correlation: this.correlation,
        },
        true,
      )
      .toPromise();
  }

  getProofFromWallet(proofRequest: any, wallet: Wallet): Promise<any> {
    console.log('UserImsApiService : getProofFromWallet()');

    const proofRequestJsonData = JSON.stringify(proofRequest);

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/proof/request',
        {
          proofRequestJsonData,
          wallet,
          correlation: this.correlation,
        },
        true,
      )
      .toPromise();
  }

  deleteWallet(wallet: Wallet): Promise<any> {
    console.log('UserImsApiService : deleteWallet()');

    return this.apiService
      .post(
        environment.url_user_ims_api,
        '/wallet/delete',
        {
          wallet,
        },
        true,
      )
      .toPromise();
  }
}
