import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { PaAccountApiService } from './pa-account-api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public type = {
    did: 'did',
    didShort: 'didShort',
    wallet: 'wallet',
    credentialRequest: 'credentialRequest',
    programId: 'programId',
    credDefId: 'credDefId'
  };

  constructor(
    public paAccountApiService: PaAccountApiService,
  ) { }

  async createAccount(username: string, password: string): Promise<any> {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.createAccount(username, password);
    }
  }

  async store(type: string, data: string): Promise<any> {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.store(type, data);
    }
  }

  async retrieve(type: string): Promise<any> {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.retrieve(type);
    }
  }

  async login(username: string, password: string): Promise<any> {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.login(username, password);
    }
  }

}
