import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { Storage } from '@ionic/storage';
import { PaAccountApiService } from './pa-account-api.service';

@Injectable({
  providedIn: 'root'
})
export class PaDataService {

  private useLocalStorage: boolean;

  public type = {
    language: 'languageCode',
    did: 'did',
    didShort: 'didShort',
    wallet: 'wallet',
    credentialRequest: 'credentialRequest',
    programId: 'programId',
    credDefId: 'credDefId'
  };

  constructor(
    private ionStorage: Storage,
    private paAccountApi: PaAccountApiService,
  ) {
    this.useLocalStorage = environment.localStorage;

  }

  /////////////////////////////////////////////////////////////////////////////
  // ALL types of storage:
  /////////////////////////////////////////////////////////////////////////////

  async store(type: string, data: string, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly) {
      return this.ionStorage.set(type, data);
    }

    return this.paAccountApi.store(type, data);
  }

  async retrieve(type: string, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly) {
      return this.ionStorage.get(type);
    }

    return this.paAccountApi.retrieve(type);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ONLY for WEB users:
  /////////////////////////////////////////////////////////////////////////////
  private featureNotAvailable(): Promise<any>  {
    return new Promise((resolve, reject) => {
      return reject('Not available with local storage');
    });
  }

  async createAccount(username: string, password: string): Promise<any> {
    if (this.useLocalStorage) {
      return this.featureNotAvailable();
    }

    return this.paAccountApi.createAccount(username, password);
  }

  async login(username: string, password: string): Promise<any> {
    if (this.useLocalStorage) {
      return this.featureNotAvailable();
    }

    return this.paAccountApi.login(username, password);
  }

}
