import { HTTP_INTERCEPTORS } from '@angular/common/http';

import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';

import { AppRoutes } from '~/app.routes';
import { isIframed } from '~/utils/is-iframed';
import { getOriginUrl } from '~/utils/url-helper';
import { environment } from '~environment';

const MSALInstanceFactory = (): IPublicClientApplication =>
  new PublicClientApplication({
    auth: {
      clientId: environment.azure_ad_client_id,
      authority: `${environment.azure_ad_url}/${environment.azure_ad_tenant_id}`,
      redirectUri: `${getOriginUrl()}/${AppRoutes.authCallback}`,
      postLogoutRedirectUri: `${getOriginUrl()}/${AppRoutes.login}`,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      allowNativeBroker: false, // Disables WAM Broker
      allowRedirectInIframe: false,
      loggerOptions: {
        loggerCallback: (_level, message, containsPii) => {
          console.log(containsPii ? '👤' : '🌐', message);
        },
        piiLoggingEnabled: !environment.production,
        logLevel: LogLevel.Info,
      },
    },
  });

const MSALInterceptorConfigFactory = (): MsalInterceptorConfiguration => {
  const protectedResourceMap = new Map([
    [
      'https://graph.microsoft.com/v1.0/me',
      ['openid, offline_access, User.read'],
    ],
    // list open endpoints here first, without scopes
    [`${environment.url_121_service_api}/users/login`, null],
    // then catch all other protected endpoints with this wildcard
    [
      `${environment.url_121_service_api}/*`,
      [`api://${environment.azure_ad_client_id}/User.read`],
    ],
  ]);

  return {
    interactionType: isIframed()
      ? InteractionType.Popup
      : InteractionType.Redirect,
    protectedResourceMap,
  };
};

const MSALGuardConfigFactory = (): MsalGuardConfiguration => ({
  loginFailedRoute: `/${AppRoutes.login}`,
  interactionType: isIframed()
    ? InteractionType.Popup
    : InteractionType.Redirect,
});

export const getMsalAuthAppProviders = () => [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: MsalInterceptor,
    multi: true,
  },
  {
    provide: MSAL_INSTANCE,
    useFactory: MSALInstanceFactory,
  },
  {
    provide: MSAL_GUARD_CONFIG,
    useFactory: MSALGuardConfigFactory,
  },
  {
    provide: MSAL_INTERCEPTOR_CONFIG,
    useFactory: MSALInterceptorConfigFactory,
  },
  MsalService,
  MsalGuard,
  MsalBroadcastService,
];
