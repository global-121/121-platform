import { EnvironmentProviders, Provider, Type } from '@angular/core';

import { Subscription } from 'rxjs';

import { User } from '~/domains/user/user.model';
import { LoginMethod } from '~/services/auth/login-method.enum';
import { LocalStorageUser } from '~/utils/local-storage';

export type LoginCredentials =
  | {
      method: LoginMethod.oneTimePassword;
      username: string;
      oneTimePassword: string;
    }
  | { method: LoginMethod.password; username: string; password: string }
  | { username: string };

export abstract class IAuthStrategy {
  public static readonly APP_PROVIDERS: (EnvironmentProviders | Provider)[];

  LoginComponent: Type<unknown>;
  ChangePasswordComponent: null | Type<unknown>;

  public abstract initializeSubscriptions(): Subscription[];
  public abstract login(credentials: LoginCredentials): Promise<null | User>;
  public abstract logout(user: LocalStorageUser | null): Promise<unknown>;
  public abstract changePassword(data: {
    user: LocalStorageUser | null;
    password: string;
    newPassword: string;
  }): Promise<unknown>;
  public abstract isUserExpired(user: LocalStorageUser | null): boolean;
  public abstract handleAuthCallback(nextPageUrl: string): void;
  /** @returns milliseconds until expiration, or `Infinity` if not applicable */
  public abstract getTimeUntilExpiration(): number;
}
