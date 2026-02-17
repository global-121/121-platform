import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

import { QueryClient } from '@tanstack/angular-query-experimental';
import { interval, Subscription } from 'rxjs';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { UserApiService } from '~/domains/user/user.api.service';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';
import { MsalAuthStrategy } from '~/services/auth/strategies/msal-auth/msal-auth.strategy';
import {
  getReturnUrlFromLocalStorage,
  getUserFromLocalStorage,
  LOCAL_STORAGE_AUTH_USER_KEY,
  LocalStorageUser,
  setReturnUrlInLocalStorage,
  setUserInLocalStorage,
} from '~/utils/local-storage';
import { environment } from '~environment';

const AuthStrategy = environment.use_sso_azure_entra
  ? MsalAuthStrategy
  : BasicAuthStrategy;

export const AUTH_ERROR_IN_STATE_KEY = 'AUTH_ERROR';
const VALID_PERMISSIONS = new Set(Object.values(PermissionEnum));

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public static APP_PROVIDERS = AuthStrategy.APP_PROVIDERS;

  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly userApiService = inject(UserApiService);
  private readonly queryClient = inject(QueryClient);

  private readonly authStrategy: IAuthStrategy;
  private tokenExpirationMonitor?: Subscription;
  // private readonly CHECK_INTERVAL_MS = 60000; // Check every minute. Should we use something else in production?
  // private readonly FORCE_LOGOUT_WHEN_EXP_IN_MS = 120000; // Logout 2 minutes before expiry. Should we use something else in production?
  private readonly CHECK_INTERVAL_MS = 6000; // Check every 6 seconds for testing
  private readonly FORCE_LOGOUT_WHEN_EXP_IN_MS = 18000; // Logout 18 seconds before expiry for testing

  constructor() {
    this.authStrategy = this.injector.get<IAuthStrategy>(AuthStrategy);
  }

  initializeSubscriptions() {
    const strategySubscriptions = this.authStrategy.initializeSubscriptions();
    this.startTokenExpirationMonitor();
    return [
      ...strategySubscriptions,
      ...(this.tokenExpirationMonitor ? [this.tokenExpirationMonitor] : []),
    ];
  }

  /**
   * Starts a continuous monitor that checks for token expiration at regular intervals.
   *
   * Design decisions:
   * - **Always runs**: Monitor starts immediately when app initializes, regardless of login state.
   *   This handles scenarios where users reopen the browser after hours/days and still have a valid token.
   * - **Continues running**: Monitor keeps running even after logout is triggered. It naturally
   *   returns early when no user is found, avoiding duplicate logout attempts.
   * - **Strategy-agnostic**: Delegates expiration logic to the auth strategy via `getTimeUntilExpiration()`.
   *   - BasicAuth: Returns actual time until token expires (reads from localStorage).
   *   - MSAL: Returns `Infinity` because MSAL handles token refresh automatically.
   *
   * @remarks
   * The monitor never stops once started. This is intentional to keep the implementation simple
   * and avoid tracking login/logout state to start/stop it. The performance impact is negligible
   * since it only checks every minute (or 6 seconds in test mode).
   *
   * @private
   */
  private startTokenExpirationMonitor(): void {
    console.log('👀 AuthService: Token expiration monitor started');
    this.tokenExpirationMonitor = interval(this.CHECK_INTERVAL_MS).subscribe(
      () => {
        const timeUntilExpiry = this.authStrategy.getTimeUntilExpiration();

        if (timeUntilExpiry === Infinity) {
          // Strategy doesn't require expiration monitoring
          return;
        }

        const secondsRemaining = Math.floor(timeUntilExpiry / 1000);
        console.log(
          `⏰ AuthService: Token check - ${String(secondsRemaining)} seconds remaining until expiry`,
        );

        // Check if token expires within the warning threshold
        if (timeUntilExpiry <= this.FORCE_LOGOUT_WHEN_EXP_IN_MS) {
          console.log(
            '🔒 AuthService: Token is about to expire. Logging out user.',
          );
          // For the real implmentation we should instead of calling the logout function create a similair function
          // only it should navigate to a 'you have been logged out due to inactivity' designed by design team

          void this.logout();
        }
      },
    );
  }

  public get isLoggedIn(): boolean {
    return this.user !== null;
  }

  public get isAdmin(): boolean {
    return this.user?.isAdmin ?? false;
  }

  public get isOrganizationAdmin(): boolean {
    return this.user?.isOrganizationAdmin ?? false;
  }

  public get ChangePasswordComponent() {
    return this.authStrategy.ChangePasswordComponent;
  }

  public get LoginComponent() {
    return this.authStrategy.LoginComponent;
  }

  public get user(): LocalStorageUser | null {
    const user = getUserFromLocalStorage();

    if (!user?.username) {
      console.info('AuthService: No (valid) user');
      return null;
    }

    if (this.authStrategy.isUserExpired(user)) {
      console.warn('AuthService: Expired token');
      return null;
    }

    // If user has deprecated permissions (e.g. after a deploy), force to re-login
    if (this.hasDeprecatedPermissions(user)) {
      console.warn(
        'AuthService: Deprecated permission found. Forcing re-login',
      );
      // Because the user is still "validly logged in", we have to actively use logout, to force a refresh of the permissions from login.
      void this.logout(user);
      return null;
    }

    return user;
  }

  public async login(
    credentials: { username: string; password?: string },
    returnUrl?: string,
  ) {
    if (returnUrl) {
      setReturnUrlInLocalStorage(returnUrl);
    }
    const user = await this.authStrategy.login(credentials);
    if (user) {
      setUserInLocalStorage(user);
    }
    return this.router.navigate(['/', AppRoutes.authCallback]);
  }

  public async logout(user?: LocalStorageUser | null) {
    try {
      await this.authStrategy.logout(user ?? this.user);
    } catch (error) {
      console.error('AuthService: Error logging out', error);
    }

    // Cleanup local state, to leave no trace of the user.
    localStorage.removeItem(LOCAL_STORAGE_AUTH_USER_KEY);

    await this.router.navigate(['/', AppRoutes.login]);
  }

  public async changePassword({
    password,
    newPassword,
  }: {
    password: string;
    newPassword: string;
  }) {
    return await this.authStrategy.changePassword({
      user: this.user,
      password,
      newPassword,
    });
  }

  public getAssignedProgramIds(): number[] {
    return this.user ? Object.keys(this.user.permissions).map(Number) : [];
  }

  private isAssignedToProgram({
    programId,
    user,
  }: {
    programId: number | string;
    user?: LocalStorageUser | null;
  }): boolean {
    user = user ?? this.user;
    return (
      !!user?.permissions &&
      Object.keys(user.permissions).includes(String(programId))
    );
  }

  public hasPermission({
    programId,
    requiredPermission,
    user,
  }: {
    programId: number | string;
    requiredPermission: PermissionEnum;
    user?: LocalStorageUser | null;
  }): boolean {
    user = user ?? this.user;
    // During development: Use this to simulate a user not having a certain permission
    // user!.permissions[programId] = user!.permissions[programId].filter(
    //   (p) => p !== PermissionEnum.RegistrationNotificationREAD,
    // );

    return (
      !!user?.permissions &&
      this.isAssignedToProgram({ programId, user }) &&
      user.permissions[Number(programId)].includes(requiredPermission)
    );
  }

  public hasAllPermissions({
    programId,
    requiredPermissions,
  }: {
    programId: number | string;
    requiredPermissions: PermissionEnum[];
  }): boolean {
    return requiredPermissions.every((permissionName) =>
      this.hasPermission({
        programId,
        requiredPermission: permissionName,
        user: this.user,
      }),
    );
  }

  public handleAuthCallback() {
    const returnUrl = getReturnUrlFromLocalStorage();

    this.authStrategy.handleAuthCallback(returnUrl ?? '/');
  }

  public hasDeprecatedPermissions(user: LocalStorageUser): boolean {
    for (const programId of Object.keys(user.permissions)) {
      for (const permission of user.permissions[Number(programId)]) {
        if (!VALID_PERMISSIONS.has(permission)) {
          return true;
        }
      }
    }
    return false;
  }

  public async refreshUserPermissions() {
    const updatedUserPermissions = (
      await this.queryClient.fetchQuery(this.userApiService.getCurrent()())
    ).user.permissions;

    setUserInLocalStorage({
      ...this.user,
      permissions: updatedUserPermissions,
    });
  }
}
