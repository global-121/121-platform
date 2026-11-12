import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { UserApiService } from '~/domains/user/user.api.service';
import {
  IAuthStrategy,
  LoginCredentials,
} from '~/services/auth/auth-strategy.interface';
import { LoginMethod } from '~/services/auth/login-method.enum';
import { BasicAuthChangePasswordComponent } from '~/services/auth/strategies/basic-auth/basic-auth.change-password.component';
import { BasicAuthLoginComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login.component';
import {
  getUserFromLocalStorage,
  LocalStorageUser,
} from '~/utils/local-storage';

@Injectable({
  providedIn: 'root',
})
export class BasicAuthStrategy implements IAuthStrategy {
  static readonly APP_PROVIDERS = [];
  private readonly userApiService = inject(UserApiService);
  private readonly router = inject(Router);

  public LoginComponent = BasicAuthLoginComponent;
  public ChangePasswordComponent = BasicAuthChangePasswordComponent;

  public initializeSubscriptions() {
    // Not applicable for basic auth
    return [];
  }

  public async login(credentials: LoginCredentials) {
    if (!('method' in credentials)) {
      throw new Error(
        $localize`Invalid email or password. Double-check your credentials and try again.`,
      );
    }

    switch (credentials.method) {
      case LoginMethod.oneTimePassword:
        return await this.loginWithOneTimePassword(credentials);
      case LoginMethod.password:
        return await this.loginWithPassword(credentials);
    }
  }

  private async loginWithOneTimePassword(credentials: {
    username: string;
    oneTimePassword: string;
  }) {
    try {
      return await this.userApiService.loginWithOneTimePassword(credentials);
    } catch {
      throw new Error(
        $localize`Invalid or expired code. Double-check the code or request a new one.`,
      );
    }
  }

  private async loginWithPassword(credentials: {
    username: string;
    password: string;
  }) {
    try {
      return await this.userApiService.login(credentials);
    } catch {
      throw new Error(
        $localize`Invalid email or password. Double-check your credentials and try again.`,
      );
    }
  }

  public async logout(user: LocalStorageUser | null): Promise<void> {
    if (!user?.username) {
      return;
    }

    await this.userApiService.logout();
  }

  public async changePassword({
    user,
    password,
    newPassword,
  }: {
    user: LocalStorageUser | null;
    password: string;
    newPassword: string;
  }) {
    const username = user?.username;

    if (!username) {
      throw new Error(
        $localize`:@@generic-error-try-again:An unexpected error has occurred. Please try again later.`,
      );
    }

    return await this.userApiService.changePassword({
      username,
      password,
      newPassword,
    });
  }

  public isUserExpired(user: LocalStorageUser | null): boolean {
    return !user?.expires || Date.parse(user.expires) < Date.now();
  }

  public getTimeUntilExpiration(): number {
    const user = getUserFromLocalStorage();

    if (!user?.expires) {
      return Infinity; // No user or expiration, don't trigger logout
    }

    const expiresAt = Date.parse(user.expires);
    const now = Date.now();
    return expiresAt - now; // Returns milliseconds until expiration
  }

  public handleAuthCallback(nextPageUrl: string): void {
    void this.router.navigate([nextPageUrl]);
  }
}
