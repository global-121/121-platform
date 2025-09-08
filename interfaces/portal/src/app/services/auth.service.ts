import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
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

  private readonly authStrategy: IAuthStrategy;

  constructor() {
    this.authStrategy = this.injector.get<IAuthStrategy>(AuthStrategy);
  }

  initializeSubscriptions() {
    return this.authStrategy.initializeSubscriptions();
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

  get user(): LocalStorageUser | null {
    const user = getUserFromLocalStorage();

    if (!user?.username) {
      console.warn('AuthService: No valid user');
      void this.logout(user);
      return null;
    }

    if (this.authStrategy.isUserExpired(user)) {
      console.warn('AuthService: Expired token');
      void this.logout(user);
      return null;
    }

    // If user has deprecated permissions (e.g. after a deploy), force to re-login
    if (this.hasDeprecatedPermissions(user)) {
      console.warn(
        'AuthService: Deprecated permission found. Forcing re-login',
      );
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

  public getAssignedProjectIds(): number[] {
    return this.user ? Object.keys(this.user.permissions).map(Number) : [];
  }

  private isAssignedToProject({
    projectId,
    user,
  }: {
    projectId: number | string;
    user?: LocalStorageUser | null;
  }): boolean {
    user = user ?? this.user;
    return (
      !!user?.permissions &&
      Object.keys(user.permissions).includes(String(projectId))
    );
  }

  public hasPermission({
    projectId,
    requiredPermission,
    user,
  }: {
    projectId: number | string;
    requiredPermission: PermissionEnum;
    user?: LocalStorageUser | null;
  }): boolean {
    user = user ?? this.user;
    // During development: Use this to simulate a user not having a certain permission
    // user!.permissions[projectId] = user!.permissions[projectId].filter(
    //   (p) => p !== PermissionEnum.RegistrationNotificationREAD,
    // );

    return (
      !!user?.permissions &&
      this.isAssignedToProject({ projectId, user }) &&
      user.permissions[Number(projectId)].includes(requiredPermission)
    );
  }

  public hasAllPermissions({
    projectId,
    requiredPermissions,
  }: {
    projectId: number | string;
    requiredPermissions: PermissionEnum[];
  }): boolean {
    return requiredPermissions.every((permissionName) =>
      this.hasPermission({
        projectId,
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
    for (const projectId of Object.keys(user.permissions)) {
      for (const permission of user.permissions[Number(projectId)]) {
        if (!VALID_PERMISSIONS.has(permission)) {
          return true;
        }
      }
    }
    return false;
  }
}
