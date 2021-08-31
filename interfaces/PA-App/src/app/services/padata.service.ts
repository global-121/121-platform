import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Program } from '../models/program.model';
import { User } from '../models/user.model';
import { JwtService } from './jwt.service';
import { PaDataTypes } from './padata-types.enum';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class PaDataService {
  public type = PaDataTypes;

  public hasAccount = false;
  private username: string;

  private currentProgramId: number;
  private myPrograms: Program[] = [];
  public myAnswers: any = {};

  private authenticationStateSource = new BehaviorSubject<boolean>(false);
  public authenticationState$ = this.authenticationStateSource.asObservable();

  constructor(
    private programService: ProgramsServiceApiService,
    private jwtService: JwtService,
  ) {
    this.checkAuthenticationState();
  }

  private setUsername(username: string) {
    this.username = username;
    window.sessionStorage.setItem(this.type.username, username);
  }

  public async getUsername(): Promise<string> {
    if (!this.username) {
      this.username = window.sessionStorage.getItem(this.type.username);
    }

    return new Promise<string>((resolve, reject) => {
      if (!this.username) {
        return reject();
      }

      return resolve(this.username);
    });
  }

  public async setCurrentProgramId(programId: number): Promise<any> {
    this.currentProgramId = programId;
    return await this.store(this.type.programId, programId);
  }

  private async getProgram(programId: number): Promise<Program> {
    // If not already available, fall back to get it from the server
    if (!this.myPrograms[programId]) {
      this.myPrograms[programId] = await this.programService.getProgramById(
        programId,
      );
    }

    return this.myPrograms[programId];
  }

  public async getCurrentProgram(): Promise<Program> {
    return await this.getProgram(await this.getCurrentProgramId());
  }

  public async getCurrentProgramId(): Promise<number> {
    if (!this.currentProgramId) {
      this.currentProgramId = Number(await this.retrieve(this.type.programId));

      // Fall back to hard-coded value, if all else fails
      if (!this.currentProgramId) {
        this.currentProgramId = 1;
      }
    }
    return this.currentProgramId;
  }

  public async saveAnswers(programId: number, answers: any): Promise<any> {
    this.myAnswers[programId] = answers;
    return this.store(this.type.myAnswers, this.myAnswers);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ALL types of storage:
  /////////////////////////////////////////////////////////////////////////////

  async store(type: string, data: any): Promise<any> {
    if (!this.hasAccount) {
      return;
    }

    return this.programService.store(type, JSON.stringify(data));
  }

  async retrieve(type: string): Promise<any> {
    if (!this.hasAccount) {
      return;
    }

    return await this.programService.retrieve(type);
  }

  async createAccount(username: string, password: string): Promise<any> {
    // 'Sanitize' username:
    username = username.trim();

    console.log('CreateAccountPA');
    return this.programService.createAccountPA(username, password).then(() => {
      console.log('Account created.');
      this.setLoggedIn();
      this.setUsername(username);
    });
  }

  async login(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programService.login(username, password).then(
        () => {
          console.log('PaData: login successful');
          const user = this.getUserFromToken();

          if (!user) {
            this.setLoggedOut();
            return reject('No valid token.');
          }

          this.setLoggedIn();
          this.setUsername(user.username);

          return resolve();
        },
        (error) => {
          console.log('PaData: login error', error);
          this.setLoggedOut();
          return reject(error);
        },
      );
    });
  }

  private setLoggedIn() {
    this.hasAccount = true;
    this.authenticationStateSource.next(true);
  }

  private setLoggedOut() {
    this.hasAccount = false;
    this.authenticationStateSource.next(false);
  }

  private checkAuthenticationState() {
    const user = this.getUserFromToken();

    if (!user) {
      return;
    }

    this.setLoggedIn();
  }

  private getUserFromToken(): User | null {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    let user: User | any;

    try {
      user = this.jwtService.decodeToken(rawToken);
    } catch {
      console.warn('PaData: Invalid token');
      return null;
    }

    if (!user || !user.username) {
      console.warn('PaData: No valid user');
      return null;
    }

    return user;
  }

  public logout() {
    console.log('PaData: logout()');
    this.jwtService.destroyToken();
    window.sessionStorage.removeItem(this.type.username);
    this.setLoggedOut();
  }
  public async deleteAccount(password: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!this.hasAccount) {
        return reject('');
      }

      await this.programService.deleteAccount(password).then(
        async () => {
          this.setLoggedOut();
          return resolve(true);
        },
        (error) => reject(error),
      );
    });
  }
}
