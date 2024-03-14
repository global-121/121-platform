import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject } from 'rxjs';
import { AppRoutes } from '../app-routes.enum';
import { User } from '../models/user.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import Permission from './permission.enum';

export const USER_KEY = 'logged-in-user-portal';
export const CURRENT_USER_ENDPOINT_PATH = '/users/current';
export const LOGIN_ENDPOINT_PATH = '/users/login';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public redirectUrl: string;
  public isIframe: boolean;
  private msalCollectionKey = 'msal.account.keys';

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private router: Router,
    private msalService: MsalService,
  ) {
    this.checkAuthenticationState();
  }

  private checkAuthenticationState() {
    const user = this.getUserFromStorage();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromStorage() !== null;
  }

  private isAssignedToProgram(programId: number, user?: User | null): boolean {
    if (!user) {
      user = this.getUserFromStorage();
    }
    return (
      user &&
      user.permissions &&
      Object.keys(user.permissions).includes(String(programId))
    );
  }

  public hasPermission(
    programId: number,
    requiredPermission: Permission,
    user?: User | null,
  ): boolean {
    if (!user) {
      user = this.getUserFromStorage();
    }
    // Use this to simulate a user not having a certain permission
    // user.permissions[programId] = user.permissions[programId].filter(
    //   (p) => p !== Permission.FspDebitCardBLOCK,
    // );
    return (
      user &&
      user.permissions &&
      this.isAssignedToProgram(programId, user) &&
      user.permissions[programId].includes(requiredPermission)
    );
  }

  public hasAllPermissions(
    programId: number,
    requiredPermissions: Permission[],
  ): boolean {
    const user = this.getUserFromStorage();
    return (
      !!programId &&
      !!requiredPermissions &&
      requiredPermissions.every((permissionName) =>
        this.hasPermission(programId, permissionName, user),
      )
    );
  }

  private getUserFromStorage(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    let user: User;

    try {
      user = JSON.parse(rawUser);
    } catch {
      console.warn('AuthService: Invalid token');
      return null;
    }
    if (!user || !user.username || !user.permissions) {
      console.warn('AuthService: No valid user');
      return null;
    }
    return {
      username: user.username,
      permissions: user.permissions,
      expires: user.expires,
      isAdmin: user.isAdmin,
    };
  }

  public async login(username: string, password: string): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.programsService.login(username, password).then(
        (response) => {
          if (response) {
            localStorage.setItem(USER_KEY, JSON.stringify(response));
          }

          const user = this.getUserFromStorage();
          this.authenticationState.next(user);

          if (!user) {
            return reject({ status: 401 });
          }

          if (this.redirectUrl) {
            this.router.navigateByUrl(this.redirectUrl);
            this.redirectUrl = null;
            return resolve();
          }

          this.router.navigate(['/', AppRoutes.home]);

          return resolve();
        },
        (error) => {
          console.error('AuthService: login error: ', error);
          return reject(error);
        },
      );
    });
  }

  public async processAzureAuthSuccess(): Promise<void> {
    const userDto = await this.programsService.getCurrentUser();
    this.processAzureUserSignIn(userDto.user);
  }

  private processAzureUserSignIn(userRO: any) {
    localStorage.setItem(USER_KEY, JSON.stringify(userRO));
    this.authenticationState.next(userRO);
    this.router.navigate(['/', AppRoutes.home]);
  }

  public async setPassword(
    username: string,
    password: string,
    newPassword: string,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.programsService.changePassword(username, password, newPassword).then(
        () => resolve(),
        (error) => {
          console.error('AuthService: change-password error: ', error);
          return reject(error);
        },
      );
    });
  }

  public async logout() {
    const user = this.getUserFromStorage();
    const azureLocalStorageDataToClear = localStorage.getItem(
      this.msalCollectionKey,
    );
    if (azureLocalStorageDataToClear && user) {
      const currentUser = this.msalService.instance.getAccountByUsername(
        user.username,
      );
      this.msalService.logoutRedirect({ account: currentUser });
    }
    localStorage.removeItem(USER_KEY);
    this.authenticationState.next(null);
    await this.programsService.logout();
    this.router.navigate(['/', AppRoutes.login]);
  }

  async checkExpirationDate() {
    const user = this.getUserFromStorage();
    if (user?.isEntraUser === true) {
      const currentUser = this.msalService.instance.getAccountByUsername(
        user.username,
      );
      const iat = currentUser.idTokenClaims.iat;
      const issuedDate = new Date(iat * 1000);
      if (issuedDate) {
        const today = new Date();
        if (
          today.getDate() !== issuedDate.getDate() ||
          today.getMonth() !== issuedDate.getMonth() ||
          today.getFullYear() !== issuedDate.getFullYear()
        ) {
          await this.logout();
        }
      }
    }
  }
}
