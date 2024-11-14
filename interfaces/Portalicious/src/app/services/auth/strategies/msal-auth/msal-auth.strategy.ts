import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { MsalService } from '@azure/msal-angular';

import { AppRoutes } from '~/app.routes';
import { User } from '~/domains/user/user.model';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { getMsalAuthAppProviders } from '~/services/auth/strategies/msal-auth/msal-auth.app-providers';
import { MsalAuthCallbackComponent } from '~/services/auth/strategies/msal-auth/msal-auth.callback.component';
import { MsalAuthLoginComponent } from '~/services/auth/strategies/msal-auth/msal-auth.login.component';
import { isIframed } from '~/utils/is-iframed';
import { LocalStorageUser } from '~/utils/local-storage';
import { environment } from '~environment';

@Injectable({
  providedIn: 'root',
})
export class MsalAuthStrategy implements IAuthStrategy {
  static readonly APP_PROVIDERS = getMsalAuthAppProviders();

  public LoginComponent = MsalAuthLoginComponent;
  public ChangePasswordComponent = null;
  public CallbackComponent = MsalAuthCallbackComponent;

  private readonly msalService = inject(MsalService);
  private readonly router = inject(Router);

  constructor() {
    this.msalService.initialize();
  }

  public async login(credentials: { username: string }) {
    if (!isIframed()) {
      this.msalService.loginRedirect({
        scopes: [`api://${environment.azure_ad_client_id}/User.read`],
        loginHint: credentials.username,
      });
    } else {
      throw new Error('TODO: AB#31469 Implement loginPopup for iframe');
    }

    // The user is being fetched & set in processAzureCallback
    return new Promise<User>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error('SSO login timed out'));
      }, 60000);
    });
  }

  public async logout(user: LocalStorageUser | null) {
    if (!user?.username) {
      return;
    }

    const currentUser = this.msalService.instance.getAccountByUsername(
      user.username,
    );

    if (!currentUser) {
      await this.router.navigate(['/', AppRoutes.login]);
      return;
    }

    const logoutRequest: Record<string, unknown> = {
      account: currentUser,
      authority: `${environment.azure_ad_url}/${currentUser.tenantId}`,
      mainWindowRedirectUri: `${window.location.origin}/${AppRoutes.login}`,
      postLogoutRedirectUri: `${window.location.origin}/${AppRoutes.login}`,
    };
    if (isIframed()) {
      this.msalService.logoutPopup(logoutRequest);
    } else {
      this.msalService.logoutRedirect(logoutRequest);
    }
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
