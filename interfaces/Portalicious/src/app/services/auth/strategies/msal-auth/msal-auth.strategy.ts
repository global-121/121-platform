import { Injectable } from '@angular/core';

import { User } from '~/domains/user/user.model';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { BasicAuthLoginComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login.component';
import { getMsalAuthAppProviders } from '~/services/auth/strategies/msal-auth/msal-auth.app-providers';

@Injectable({
  providedIn: 'root',
})
export class MsalAuthStrategy implements IAuthStrategy {
  static readonly APP_PROVIDERS = getMsalAuthAppProviders();

  // XXX: Implement MSAL login component
  public LoginComponent = BasicAuthLoginComponent;
  public ChangePasswordComponent = null;

  public async login() {
    // XXX: Implement login
    return Promise.resolve({} as User);
  }

  public async logout() {
    // XXX: Implement logout
    return Promise.resolve();
  }

  public async changePassword() {
    return Promise.reject(
      new Error('This should never be called for MSAL service.'),
    );
  }

  public isUserExpired() {
    // Not applicable for MSAL
    return false;
  }
}
