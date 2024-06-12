import { HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppRoutes } from '../app-routes.enum';
import { User } from '../models/user.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { getFullISODate } from '../shared/utils/get-iso-date.util';
import { isIframed } from '../shared/utils/is-iframed.util';
import Permission from './permission.enum';

export const USER_KEY = 'logged-in-user-portal';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private useSso = environment.use_sso_azure_entra;

  public redirectUrl: string;

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private router: Router,
    private msalService?: MsalService,
  ) {
    this.updateAuthenticationState();
  }

  private updateAuthenticationState() {
    const user = this.getUserFromStorage();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromStorage() !== null;
  }

  public getAssignedProgramIds(user?: User | null): number[] {
    if (!user) {
      user = this.getUserFromStorage();
    }
    const assignedProgramIds = user
      ? Object.keys(user.permissions).map(Number)
      : [];
    return assignedProgramIds;
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
    // During development: Use this to simulate a user not having a certain permission
    // user.permissions[programId] = user.permissions[programId].filter(
    //   (p) => p !== Permission.FspDebitCardBLOCK,
    // );

    // TODO: Move this to a better place in the flow, so it doesn't have to be checked this often
    // Check with Azure (again) when user has no permissions (yet)
    if (!this.isAssignedToProgram(programId, user)) {
      this.processAzureAuthSuccess(); // Don't await, as it will block all permission-checks
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

  private setUserInStorage(user: User): void {
    const userToStore: User = {
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
      isEntraUser: user.isEntraUser,
    };

    if (user.expires) {
      userToStore.expires = user.expires;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(userToStore));
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
      expires: user.expires ? user.expires : '',
      isAdmin: user.isAdmin,
      isEntraUser: user.isEntraUser,
    };
  }

  public async login(username: string, password: string): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.programsService.login(username, password).then(
        (response) => {
          if (response) {
            this.setUserInStorage(response);
          }

          const user = this.getUserFromStorage();
          this.updateAuthenticationState();

          if (!user) {
            return reject({ status: HttpStatusCode.Unauthorized });
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
  public async processAzureAuthSuccess(redirectToHome = false): Promise<void> {
    const userDto = await this.programsService.getCurrentUser();

    if (!userDto || !userDto.user) {
      localStorage.removeItem(USER_KEY);
      this.router.navigate(['/', AppRoutes.login]);
      return;
    }

    await this.checkSsoTokenExpirationDate();
    this.setUserInStorage(userDto.user);
    this.updateAuthenticationState();

    if (redirectToHome) {
      setTimeout(() => {
        this.router.navigate(['/', AppRoutes.home]);
      }, 2_000);
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

    if (!user || !user.username) {
      this.router.navigate(['/', AppRoutes.login]);
      return;
    }

    // Cleanup local state, to leave no trace of the user.
    localStorage.removeItem(USER_KEY);

    if (this.useSso) {
      await this.logoutSsoUser(user.username);

      // No need to continue here, as the MSAL service will handle the redirect/clenaup/rest.
      return;
    }

    await this.programsService.logout();
    this.updateAuthenticationState();
    this.router.navigate(['/', AppRoutes.login]);
  }

  private async logoutSsoUser(username: string) {
    const currentUser =
      this.msalService.instance.getAccountByUsername(username);

    if (!currentUser) {
      this.router.navigate(['/', AppRoutes.login]);
      return;
    }

    if (isIframed()) {
      this.msalService.logoutPopup({
        account: currentUser,
        mainWindowRedirectUri: `${window.location.origin}/${AppRoutes.login}`,
      });
    } else {
      this.msalService.logoutRedirect({
        account: currentUser,
      });
    }
  }

  public async logoutNonSsoUser() {
    const user = this.getUserFromStorage();

    if (user?.isEntraUser === false) {
      console.log('Logging out non-SSO user', user.username);
      await this.logout();
    }
  }

  public async checkSsoTokenExpirationDate(): Promise<void> {
    const user = this.getUserFromStorage();

    if (!user || (user && user.isEntraUser === false)) {
      return;
    }

    const currentUser = this.msalService.instance.getAccountByUsername(
      user.username,
    );

    const today = new Date();
    const issuedDate = new Date(currentUser?.idTokenClaims?.iat * 1_000);

    if (
      currentUser?.idTokenClaims?.iat &&
      // Only allow tokens issued on the same day (both are in UTC, so not comparing to local time/day)
      getFullISODate(today) === getFullISODate(issuedDate)
    ) {
      return;
    }

    // Force logout and redirect to login
    await this.logout();
  }
}
