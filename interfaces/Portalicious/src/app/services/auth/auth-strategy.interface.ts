import { EnvironmentProviders, Provider, Type } from '@angular/core';

import { User } from '~/domains/user/user.model';
import { LocalStorageUser } from '~/utils/local-storage';

export abstract class IAuthStrategy {
  public static readonly APP_PROVIDERS: (EnvironmentProviders | Provider)[];

  LoginComponent: Type<unknown>;
  ChangePasswordComponent: null | Type<unknown>;
  CallbackComponent: null | Type<unknown>;

  public abstract login(credentials?: {
    username: string;
    password?: string;
  }): Promise<User>;
  public abstract logout(user: LocalStorageUser | null): Promise<void>;
  public abstract changePassword(data: {
    user: LocalStorageUser | null;
    password: string;
    newPassword: string;
  }): Promise<unknown>;
  public abstract isUserExpired(user: LocalStorageUser | null): boolean;
}
