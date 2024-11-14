import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, Injector, signal } from '@angular/core';
import { Router } from '@angular/router';

import { injectQueryClient } from '@tanstack/angular-query-experimental';
import { get } from 'lodash';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { UserApiService } from '~/domains/user/user.api.service';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';
import { MsalAuthStrategy } from '~/services/auth/strategies/msal-auth/msal-auth.strategy';
import { LogEvent, LogService } from '~/services/log.service';
import {
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public static APP_PROVIDERS = AuthStrategy.APP_PROVIDERS;

  private readonly logService = inject(LogService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly userApiService = inject(UserApiService);

  private queryClient = injectQueryClient();

  private readonly authStrategy: IAuthStrategy;

  constructor() {
    this.authStrategy = this.injector.get<IAuthStrategy>(AuthStrategy);
  }
  public authError = signal<string | undefined>(undefined);

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

  public get CallbackComponent() {
    return this.authStrategy.CallbackComponent;
  }

  get user(): LocalStorageUser | null {
    const user = getUserFromLocalStorage();

    if (!user?.username) {
      console.warn('AuthService: No valid user');
      return null;
    }

    if (this.authStrategy.isUserExpired(user)) {
      console.warn('AuthService: Expired token');
      return null;
    }

    return user;
  }

  public async login(
    credentials?: { username: string; password?: string },
    returnUrl?: string,
  ) {
    this.logService.logEvent(LogEvent.userLogin);
    if (returnUrl) {
      setReturnUrlInLocalStorage(returnUrl);
    }
    const user = await this.authStrategy.login(credentials);
    // Note: SSO never resolves so the code below this line is not executed in the SSO case
    setUserInLocalStorage(user);

    if (returnUrl) {
      return this.router.navigate([returnUrl]);
    }

    return this.router.navigate(['/']);
  }

  public async logout() {
    this.logService.logEvent(LogEvent.userLogout);

    await this.authStrategy.logout(this.user);

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
    projectId: number;
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
    projectId: number;
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
      user.permissions[projectId].includes(requiredPermission)
    );
  }

  public hasAllPermissions({
    projectId,
    requiredPermissions,
  }: {
    projectId: number;
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

  async processAzureCallback() {
    try {
      const currentUser = await this.queryClient.fetchQuery(
        this.userApiService.getCurrent()(),
      );
      setUserInLocalStorage(currentUser.user);
    } catch (error) {
      // TODO: AB#31489 Return a more generic endpoint from the back-end
      if (error instanceof HttpErrorResponse) {
        const errorMessage = get(error.error, 'message') as string | undefined;
        if (errorMessage) {
          this.authError.set(errorMessage);
        }
      }
      throw error;
    }
  }
}
