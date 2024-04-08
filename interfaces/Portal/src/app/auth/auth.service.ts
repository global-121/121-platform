import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppRoutes } from '../app-routes.enum';
import { User } from '../models/user.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import Permission from './permission.enum';

export const USER_KEY = 'logged-in-user-portal';
export const CURRENT_USER_ENDPOINT_PATH = '/users/current';
export const LOGIN_ENDPOINT_PATH = '/users/login';
export const LOGOUT_ENDPOINT_PATH = '/users/logout';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public redirectUrl: string;
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

  public async hasPermission(
    programId: number,
    requiredPermission: Permission,
    user?: User | null,
  ): Promise<boolean> {
    if (!user) {
      user = this.getUserFromStorage();
    }
    // Use this to simulate a user not having a certain permission
    // user.permissions[programId] = user.permissions[programId].filter(
    //   (p) => p !== Permission.FspDebitCardBLOCK,
    // );
    const hasPermissionsInUserObject = Object.keys(user.permissions).includes(
      programId.toString(),
    );
    if (!hasPermissionsInUserObject) {
      await this.processAzureAuthSuccess(false);
    }
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

    if (
      // Only check for non-SSO users
      !environment.use_sso_azure_entra &&
      (!user.expires || Date.parse(user.expires) < Date.now())
    ) {
      console.warn('AuthService: Expired token');
      return null;
    }

    return {
      username: user.username,
      permissions: user.permissions,
      expires: user.expires,
      isAdmin: user.isAdmin,
      isEntraUser: user.isEntraUser,
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

  // TODO: Think of a better name for this method
  public async processAzureAuthSuccess(redirectToHome = true): Promise<void> {
    const userDto = await this.programsService.getCurrentUser();
    this.processAzureUserSignIn(userDto.user, redirectToHome);
  }

  private processAzureUserSignIn(userRO: any, redirectToHome: boolean) {
    localStorage.setItem(USER_KEY, JSON.stringify(userRO));
    this.authenticationState.next(userRO);
    if (redirectToHome) {
      setTimeout(() => {
        this.router.navigate(['/', AppRoutes.home]);
      }, 2000);
    }
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
      if (this.router.url.includes('iframe')) {
        this.msalService.logoutPopup({
          account: currentUser,
          mainWindowRedirectUri: `${window.location.origin}/login`,
        });
      } else {
        this.msalService.logoutRedirect({ account: currentUser });
      }
      localStorage.removeItem(this.msalCollectionKey);
    }
    localStorage.removeItem(USER_KEY);
    this.authenticationState.next(null);
    await this.programsService.logout();
    this.router.navigate(['/', AppRoutes.login]);
  }

  public async logoutNonSSOUser() {
    const user = this.getUserFromStorage();
    if (user?.isEntraUser === false) {
      console.log('Logging out non-SSO user', user.username);
      await this.logout();
    }
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
