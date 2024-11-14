import { inject, Injectable, Signal } from '@angular/core';

import { UserApiService } from '~/domains/user/user.api.service';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { BasicAuthChangePasswordComponent } from '~/services/auth/strategies/basic-auth/basic-auth.change-password.component';
import { BasicAuthLoginComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login.component';
import { LocalStorageUser } from '~/utils/local-storage';

@Injectable({
  providedIn: 'root',
})
export class BasicAuthStrategy implements IAuthStrategy {
  private readonly userApiService = inject(UserApiService);

  static readonly APP_PROVIDERS = [];

  public LoginComponent = BasicAuthLoginComponent;
  public ChangePasswordComponent = BasicAuthChangePasswordComponent;
  public CallbackComponent = null;

  public async login(credentials: { username: string; password: string }) {
    try {
      const user = await this.userApiService.login(credentials);
      return user;
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

  public authError: Signal<string | undefined>;
}
