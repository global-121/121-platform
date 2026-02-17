import { EnvironmentProviders, Provider, Type } from '@angular/core';

import { Subscription } from 'rxjs';

import { User } from '~/domains/user/user.model';
import { LocalStorageUser } from '~/utils/local-storage';

export abstract class IAuthStrategy {
  public static readonly APP_PROVIDERS: (EnvironmentProviders | Provider)[];

  LoginComponent: Type<unknown>;
  ChangePasswordComponent: null | Type<unknown>;

  public abstract initializeSubscriptions(): Subscription[];
  public abstract login(credentials: {
    username: string;
    password?: string;
  }): Promise<null | User>;
  public abstract logout(user: LocalStorageUser | null): Promise<unknown>;
  public abstract changePassword(data: {
    user: LocalStorageUser | null;
    password: string;
    newPassword: string;
  }): Promise<unknown>;
  public abstract isUserExpired(user: LocalStorageUser | null): boolean;
  public abstract handleAuthCallback(nextPageUrl: string): void;
  public abstract getTimeUntilExpiration(): number; // Returns milliseconds until expiration, or Infinity if not applicable
}
