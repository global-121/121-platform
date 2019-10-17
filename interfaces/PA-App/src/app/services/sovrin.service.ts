import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { UserImsApiService } from './user-ims-api.service';

class Wallet {
  id: string;
  passKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class SovrinService {

  private useLocalStorage: boolean;

  constructor(
    private userImsApi: UserImsApiService,
  ) {
    this.useLocalStorage = environment.localStorage;

  }

  private toDoSDK(message: string): Promise<any> {
    return new Promise((resolve) => {
      return resolve(message);
    });
  }

  createWallet(wallet: Wallet): Promise<any> {
    console.log('SovrinService : createWallet()');

    if (this.useLocalStorage) {
      return this.toDoSDK('SDK: createWallet');
    }

    return this.userImsApi.createWallet(wallet);
  }

  createStoreDid(wallet: Wallet): Promise<any> {
    console.log('SovrinService : createStoreDid()');

    if (this.useLocalStorage) {
      return this.toDoSDK('SDK: createStoreDid');
    }

    return this.userImsApi.createStoreDid(wallet);
  }

  createCredentialRequest(
    wallet: Wallet,
    credDefID: string,
    credentialOffer: JSON,
    did: string,
  ): Promise<any> {
    console.log('SovrinService : createCredentialRequest()');

    if (this.useLocalStorage) {
      return this.toDoSDK('SDK: createCredentialRequest');
    }

    return this.userImsApi.createCredentialRequest(
      wallet,
      credDefID,
      credentialOffer,
      did,
    );
  }

  storeCredential(
    credDefID: string,
    credentialRequestMetadata: any,
    credential: any,
    wallet: Wallet,
  ): Promise<any> {
    console.log('SovrinService : storeCredential()');

    if (this.useLocalStorage) {
      return this.toDoSDK('SDK: storeCredential');
    }

    return this.userImsApi.storeCredential(
      credDefID,
      credentialRequestMetadata,
      credential,
      wallet,
    );
  }

  getProofFromWallet(
    proofRequest: any,
    wallet: Wallet,
  ): Promise<any> {
    console.log('SovrinService : getProofFromWallet()');

    if (this.useLocalStorage) {
      return this.toDoSDK('SDK: getProofFromWallet');
    }

    return this.userImsApi.getProofFromWallet(
      proofRequest,
      wallet,
    );
  }
}
