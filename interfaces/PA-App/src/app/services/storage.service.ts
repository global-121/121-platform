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

  async create(username: string, password: string) {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.create(username, password).toPromise();
    }
  }

  async store(type: string, data: string) {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.store(type, data).toPromise();
    }
  }

  async retrieve(type: string) {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.retrieve(type).toPromise();
    }
  }

  login(username: string, password: string) {
    if (environment.localStorage) {
      // use local sotrage
    } else {
      return this.paAccountApiService.login(username, password).toPromise();
    }
  }

}
