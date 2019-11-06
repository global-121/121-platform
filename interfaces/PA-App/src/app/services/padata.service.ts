import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { Storage } from '@ionic/storage';
import { PaAccountApiService } from './pa-account-api.service';
import { Program } from '../models/program.model';
import { JwtService } from './jwt.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaDataService {

  private useLocalStorage: boolean;

  public type = {
    language: 'languageCode',
    country: 'countryId',
    did: 'did',
    didShort: 'didShort',
    wallet: 'wallet',
    credentialRequest: 'credentialRequest',
    programId: 'programId',
    credDefId: 'credDefId',
    timeslot: 'timeslotChoice',
    myPrograms: 'myPrograms',
    myAnswers: 'myAnswers',
  };

  public myPrograms: any = {};
  public myAnswers: any = {};

  private authenticationStateSource = new Subject<boolean>();
  public authenticationState$ = this.authenticationStateSource.asObservable();

  constructor(
    private ionStorage: Storage,
    private paAccountApi: PaAccountApiService,
    private jwtService: JwtService
  ) {
    this.useLocalStorage = environment.localStorage;
  }

  async saveProgram(programId: number, program: Program): Promise<any> {
    this.myPrograms[programId] = program;
    return this.store(this.type.myPrograms, this.myPrograms);
  }

  async saveAnswers(programId: number, answers: any): Promise<any> {
    this.myAnswers[programId] = answers;
    return this.store(this.type.myAnswers, this.myAnswers);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ALL types of storage:
  /////////////////////////////////////////////////////////////////////////////

  async store(type: string, data: any, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly) {
      return this.ionStorage.set(type, data);
    }

    return this.paAccountApi.store(type, JSON.stringify(data));
  }

  async retrieve(type: string, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly) {
      return this.ionStorage.get(type);
    }

    return JSON.parse(await this.paAccountApi.retrieve(type));
  }

  /////////////////////////////////////////////////////////////////////////////
  // ONLY for WEB users:
  /////////////////////////////////////////////////////////////////////////////
  private featureNotAvailable(): Promise<any> {
    return new Promise((resolve) => {
      return resolve('Not available with local storage');
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

  async setLoggedIn(): Promise<void> {
    this.store('isLoggedIn', true, true);
    this.authenticationStateSource.next(true);
  }

  async logout() {
    console.log('PA-accounts-service : logout()');
    this.jwtService.destroyToken();
    this.store('isLoggedIn', false, true);
    this.authenticationStateSource.next(false);
  }

}
