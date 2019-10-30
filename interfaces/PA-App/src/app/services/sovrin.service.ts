import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { UserImsApiService } from './user-ims-api.service';

declare var Global121: any;

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
    this.useLocalStorage = environment.localStorage && this.hasSdkInstalled();

    // Check/Perform initial Sovrin setup:
    if (this.useLocalStorage) {
      this.initialSovrinSetup();
    }
  }

  private hasSdkInstalled() {
    const sdkInstalled = ('Global121' in window);
    console.log('SovrinService: hasSdkInstalled?', sdkInstalled);

    return sdkInstalled;
  }

  private initialSovrinSetup() {
    console.log('SovrinService: initialSovrinSetup()');

    Global121.Indy.setup()
    .then(this.sdkSuccessHandler, this.sdkErrorHandler);
  }

  private toDoSDK(message: string): Promise<any> {
    return new Promise((resolve) => {
      return resolve(message);
    });
  }

  private sdkSuccessHandler(success: any) {
    console.log('SDK Result:', success);
  }

  private sdkErrorHandler(error: any) {
    console.warn('SDK Error:', error);
  }

  async createWallet(wallet: Wallet): Promise<any> {
    console.log('SovrinService : createWallet()');

    if (this.useLocalStorage) {
      console.log('SDK: createWallet');
      await Global121.Indy.createWallet({
        password: wallet.passKey,
      })
      .then(this.sdkSuccessHandler, this.sdkErrorHandler);
      console.log('SDK: createMasterSecret');
      return Global121.Indy.createMasterSecret({
        password: wallet.passKey,
      })
      .then(this.sdkSuccessHandler, this.sdkErrorHandler);
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
