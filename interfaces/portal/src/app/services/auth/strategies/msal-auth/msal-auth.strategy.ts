import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  PopupRequest,
  RedirectRequest,
} from '@azure/msal-browser';
import { QueryClient } from '@tanstack/angular-query-experimental';

import { AppRoutes } from '~/app.routes';
import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { AUTH_ERROR_IN_STATE_KEY } from '~/services/auth.service';
import { IAuthStrategy } from '~/services/auth/auth-strategy.interface';
import { getMsalAuthAppProviders } from '~/services/auth/strategies/msal-auth/msal-auth.app-providers';
import { MsalAuthLoginComponent } from '~/services/auth/strategies/msal-auth/msal-auth.login.component';
import { isIframed } from '~/utils/is-iframed';
import { LocalStorageUser, setUserInLocalStorage } from '~/utils/local-storage';
import { getOriginUrl } from '~/utils/url-helper';
import { environment } from '~environment';

@Injectable({
  providedIn: 'root',
})
export class MsalAuthStrategy implements IAuthStrategy {
  static readonly APP_PROVIDERS = getMsalAuthAppProviders();

  public LoginComponent = MsalAuthLoginComponent;
  public ChangePasswordComponent = null;

  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly router = inject(Router);
  private readonly userApiService = inject(UserApiService);
  private queryClient = inject(QueryClient);

  constructor() {
    this.msalService.initialize();
  }

  public initializeSubscriptions() {
    return [
      this.msalService.handleRedirectObservable().subscribe(), // Subscribing to handleRedirectObservable before any other functions both initializes the application and ensures redirects are handled
      this.msalBroadcastService.msalSubject$.subscribe(
        (result: EventMessage) => {
          console.log('🚀 ~ MsalAuthStrategy ~ .subscribe ~ result:', result);
        },
      ),
    ];
  }

  public async login(credentials: { username: string }) {
    const loginRequest: PopupRequest | RedirectRequest = {
      scopes: [`api://${environment.azure_ad_client_id}/User.read`],
      loginHint: credentials.username,
    };

    // Popup scenario
    if (isIframed()) {
      return new Promise<null>((resolve, reject) => {
        const sub = this.msalService
          .loginPopup(loginRequest)
          .subscribe((data: AuthenticationResult | null) => {
            sub.unsubscribe();
            if (!data) {
              reject(
                new Error(
                  'MSAL Strategy: an error occurred while logging in with popup',
                ),
              );
            }
            resolve(null);
          });
      });
    }

    // Redirect scenario
    this.msalService.loginRedirect(loginRequest);

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
      mainWindowRedirectUri: `${getOriginUrl()}/${AppRoutes.login}`,
      postLogoutRedirectUri: `${getOriginUrl()}/${AppRoutes.login}`,
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

  public getTimeUntilExpiration(): number {
    // MSAL handles token refresh automatically, so we never need to force logout
    return Infinity;
  }

  public handleAuthCallback(nextPageUrl: string) {
    if (isIframed()) {
      void this.refreshUserAndNavigate(nextPageUrl);
      return;
    }

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
      await this.router.navigate(['/', AppRoutes.login], {
        state: {
          [AUTH_ERROR_IN_STATE_KEY]: $localize`Unknown user account or authentication failed`,
        },
      });
    }
  }
}
