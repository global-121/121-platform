import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { injectQueryClient } from '@tanstack/angular-query-experimental';

import { AppRoutes } from '~/app.routes';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { AUTH_ERROR_IN_STATE_KEY } from '~/services/auth.service';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { getMsalAuthAppProviders } from '~/services/auth/strategies/msal-auth/msal-auth.app-providers';
import { MsalAuthLoginComponent } from '~/services/auth/strategies/msal-auth/msal-auth.login.component';
import { isIframed } from '~/utils/is-iframed';
import { LocalStorageUser, setUserInLocalStorage } from '~/utils/local-storage';
import { environment } from '~environment';

@Injectable({
  providedIn: 'root',
})
export class MsalAuthStrategy implements IAuthStrategy {
  static readonly APP_PROVIDERS = getMsalAuthAppProviders();

  public LoginComponent = MsalAuthLoginComponent;
  public ChangePasswordComponent = null;

  private readonly msalService = inject(MsalService);
  private readonly router = inject(Router);
  private readonly userApiService = inject(UserApiService);
  private queryClient = injectQueryClient();

  constructor() {
    this.msalService.initialize();
  }

  public initializeSubscriptions() {
    return [this.msalService.handleRedirectObservable().subscribe()]; // Subscribing to handleRedirectObservable before any other functions both initializes the application and ensures redirects are handled
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

    // The user is being fetched & set in msal-auth.callback.component
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
      return this.router.navigate(['/', AppRoutes.login]);
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
    return;
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

  public handleAuthCallback(nextPageUrl: string) {
    const subscription = this.msalService
      .handleRedirectObservable()
      .subscribe((data: AuthenticationResult | null) => {
        if (!data) {
          return;
        }
        subscription.unsubscribe();

        void this.refreshUserAndNavigate(nextPageUrl);
      });
  }

  async refreshUserAndNavigate(nextPageUrl: string) {
    try {
      const currentUser = await this.queryClient.fetchQuery(
        this.userApiService.getCurrent()(),
      );
      setUserInLocalStorage(currentUser.user);
      await this.router.navigate([nextPageUrl], {
        // set to undefined because otherwise the auth error lingers in some local/session storage
        state: undefined,
      });
    } catch {
      // TODO: AB#31489 Return a more generic endpoint from the back-end
      await this.router.navigate(['/', AppRoutes.login], {
        state: {
          [AUTH_ERROR_IN_STATE_KEY]: $localize`Unknown user account or authentication failed`,
        },
      });
    }
  }
}
