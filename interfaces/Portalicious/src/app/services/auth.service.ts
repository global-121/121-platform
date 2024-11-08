import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { User } from '~/domains/user/user.model';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';
import { MsalAuthStrategy } from '~/services/auth/strategies/msal-auth/msal-auth.strategy';
import { LogEvent, LogService } from '~/services/log.service';
import { environment } from '~environment';

export type LocalStorageUser = Pick<
  User,
  | 'expires'
  | 'isAdmin'
  | 'isEntraUser'
  | 'isOrganizationAdmin'
  | 'permissions'
  | 'username'
>;

const LOCAL_STORAGE_AUTH_USER_KEY = 'logged-in-user-portalicious';

export function getUserFromLocalStorage(): LocalStorageUser | null {
  const rawUser = localStorage.getItem(LOCAL_STORAGE_AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  let user: LocalStorageUser;

  try {
    user = JSON.parse(rawUser) as LocalStorageUser;
  } catch {
    console.warn('AuthService: Invalid token');
    return null;
  }

  return user;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly logService = inject(LogService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  private readonly authStrategy: IAuthStrategy;

  constructor() {
    const AuthStrategy = environment.use_sso_azure_entra
      ? MsalAuthStrategy
      : BasicAuthStrategy;

    this.authStrategy = this.injector.get(AuthStrategy);
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

  private setUserInStorage(user: User): void {
    const userToStore: LocalStorageUser = {
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
      isOrganizationAdmin: user.isOrganizationAdmin,
      isEntraUser: user.isEntraUser,
      expires: user.expires,
    };

    localStorage.setItem(
      LOCAL_STORAGE_AUTH_USER_KEY,
      JSON.stringify(userToStore),
    );
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
    credentials: { username: string; password?: string },
    returnUrl?: string,
  ) {
    this.logService.logEvent(LogEvent.userLogin);
    const user = await this.authStrategy.login(credentials);
    this.setUserInStorage(user);

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
}
