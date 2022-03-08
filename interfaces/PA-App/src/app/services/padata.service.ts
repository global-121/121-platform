import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Program } from '../models/program.model';
import { User } from '../models/user.model';
import { PaDataTypes } from './padata-types.enum';
import { ProgramsServiceApiService } from './programs-service-api.service';

@Injectable({
  providedIn: 'root',
})
export class PaDataService {
  public type = PaDataTypes;
  private sessionKey = 'logged-in-user-PA';

  private hasAccount = false;

  private currentProgramId: number;
  private myPrograms: Program[] = [];
  public myAnswers: any = {};

  private authenticationStateSource = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationStateSource.asObservable();

  constructor(private programService: ProgramsServiceApiService) {
    this.checkAuthenticationState();
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

    return this.programService
      .createAccountPA(username, password)
      .then((user) => {
        if (!user) {
          return;
        }
        console.log('PaData: Account created.');
        this.saveUserInStorage(user);
        this.setLoggedIn(user);
        return user;
      });
  }

  async login(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programService.login(username, password).then(
        (user) => {
          if (!user) {
            this.setLoggedOut();
            return reject('No valid user.');
          }
          console.log('PaData: login successful');
          this.saveUserInStorage(user);
          this.setLoggedIn(user);

          return resolve(user);
        },
        (error) => {
          console.log('PaData: login error', error);
          this.setLoggedOut();
          return reject(error);
        },
      );
    });
  }

  private setLoggedIn(user: User) {
    this.hasAccount = true;
    this.authenticationStateSource.next(user);
  }

  private setLoggedOut() {
    this.hasAccount = false;
    this.authenticationStateSource.next(null);
  }

  private checkAuthenticationState() {
    const user = this.getUserFromStorage();

    if (!user) {
      return;
    }

    this.setLoggedIn(user);
  }

  private getUserFromStorage(): User | null {
    const rawUser = window.sessionStorage.getItem(this.sessionKey);

    if (!rawUser) {
      return null;
    }

    let user: User | any;

    try {
      user = JSON.parse(rawUser);
    } catch {
      console.warn('PaData: Invalid user-data');
      return null;
    }

    if (!user || !user.username) {
      console.warn('PaData: No valid user');
      return null;
    }

    return user;
  }

  private saveUserInStorage(user: User) {
    if (!user) {
      return;
    }
    window.sessionStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  public async logout() {
    console.log('PaData: logout()');
    window.sessionStorage.removeItem(this.sessionKey);
    await this.programService.logout();
    this.setLoggedOut();
  }

  public async deleteData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (!this.hasAccount) {
        return reject('');
      }

      await this.programService.deleteData().then(
        async () => {
          this.setLoggedOut();
          return resolve(true);
        },
        (error) => reject(error),
      );
    });
  }
}
