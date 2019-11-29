import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { Storage } from '@ionic/storage';
import { PaAccountApiService } from './pa-account-api.service';
import { Program } from '../models/program.model';
import { JwtService } from './jwt.service';
import { BehaviorSubject } from 'rxjs';

import { PaDataTypes } from './padata-types.enum';

@Injectable({
  providedIn: 'root'
})
export class PaDataService {

  private useLocalStorage: boolean;

  public type = PaDataTypes;

  public hasAccount = false;
  public myPrograms: any = {};
  public myAnswers: any = {};

  private authenticationStateSource = new BehaviorSubject<boolean>(false);
  public authenticationState$ = this.authenticationStateSource.asObservable();

  constructor(
    private ionStorage: Storage,
    private paAccountApi: PaAccountApiService,
    private jwtService: JwtService
  ) {
    this.useLocalStorage = environment.localStorage;

    this.retrieveLoggedInState();
  }

  async saveProgram(programId: number, program: Program): Promise<any> {
    this.myPrograms[programId] = program;
    return this.store(this.type.myPrograms, this.myPrograms);
  }

  async getProgram(programId: number): Promise<Program> {
    if (!this.myPrograms[programId]) {
      // Fall back to get it from the server
      this.myPrograms = await this.retrieve(this.type.myPrograms);
    }

    return new Promise<Program>((resolve, reject) => {
      if (!this.myPrograms[programId]) {
        return reject();
      }

      return resolve(this.myPrograms[programId]);
    });
  }

  async getCurrentProgram() {
    const currentProgramId = await this.retrieve(this.type.programId);

    return this.getProgram(currentProgramId);
  }

  async saveAnswers(programId: number, answers: any): Promise<any> {
    this.myAnswers[programId] = answers;
    return this.store(this.type.myAnswers, this.myAnswers);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ALL types of storage:
  /////////////////////////////////////////////////////////////////////////////

  async store(type: string, data: any, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly || !this.hasAccount) {
      return this.ionStorage.set(type, data);
    }

    return this.paAccountApi.store(type, JSON.stringify(data));
  }

  async retrieve(type: string, forceLocalOnly = false): Promise<any> {
    if (this.useLocalStorage || forceLocalOnly || !this.hasAccount) {
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

    console.log('PaData: createAccount()');
    return this.paAccountApi.createAccount(username, password).then(
      () => {
        console.log('Account created.');
        this.setLoggedIn();
      }
    );
  }

  async login(username: string, password: string): Promise<any> {
    if (this.useLocalStorage) {
      return this.featureNotAvailable();
    }

    console.log('PaData: login()');
    return new Promise((resolve, reject) => {
      this.paAccountApi.login(username, password)
      .then(
        async (response) => {
          console.log('PaData: login successful', response);
          this.ionStorage.clear();
          this.setLoggedIn();
          return resolve(response);
        },
        (error) => {
          console.log('PaData: login error', error);
          this.setLoggedOut();
          return reject(error);
        }
      );
    });
  }

  private setLoggedIn() {
    console.log('PaData: setLoggedIn()');
    this.hasAccount = true;
    this.authenticationStateSource.next(true);
  }

  private setLoggedOut() {
    console.log('PaData: setLoggedOut()');
    this.hasAccount = false;
    this.authenticationStateSource.next(false);
  }

  private retrieveLoggedInState() {
    const token = this.jwtService.getToken();

    if (!token) {
      return;
    }

    this.setLoggedIn();
  }

  public logout() {
    if (this.useLocalStorage) {
      return this.featureNotAvailable();
    }

    console.log('PaData: logout()');
    this.jwtService.destroyToken();
    this.ionStorage.clear();
    this.setLoggedOut();
  }

}
