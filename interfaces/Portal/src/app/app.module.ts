import { LOCATION_INITIALIZED } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  MsalBroadcastService,
  MsalModule,
  MsalService,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from 'src/environments/environment';
import { AppRoutes } from './app-routes.enum';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiPath } from './enums/api-path.enum';
import { AzureSsoExpireInterceptor } from './interceptors/azure-sso-expire.interceptor';
import { MsalSkipInterceptor } from './interceptors/msal-skip.interceptor';
import { ErrorHandlerService } from './services/error-handler.service';
import { LoggingService } from './services/logging.service';
import { isIframed } from './shared/utils/is-iframed.util';

export function appInitializerFactory(
  translate: TranslateService,
  injector: Injector,
) {
  const langToSet = 'en';

  return () =>
    new Promise<any>((resolve: any) => {
      const locationInitialized = injector.get(
        LOCATION_INITIALIZED,
        Promise.resolve(null),
      );
      locationInitialized.then(() => {
        translate.setDefaultLang(langToSet);
        translate.use(langToSet).subscribe(
          () => {
            console.log(`Successfully initialized '${langToSet}' language.`);
          },
          (err) => {
            console.log(
              `Problem with '${langToSet}' language initialization: `,
              err,
            );
          },
          () => {
            resolve(null);
          },
        );
      });
    });
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/');
}

let ssoInterceptors = [];

// Only configure/load SSO dependencies when necessary
if (environment.use_sso_azure_entra) {
  ssoInterceptors = [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalSkipInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AzureSsoExpireInterceptor,
      multi: true,
    },
  ];
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md',
      innerHTMLTemplatesEnabled: true,
    }),
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.useServiceWorker && environment.production,
    }),
    MsalModule.forRoot(
      new PublicClientApplication({
        auth: {
          clientId: environment.azure_ad_client_id,
          authority: `https://${environment.azure_ad_tenant_id}.ciamlogin.com/${environment.azure_ad_tenant_id}/v2.0`,
          redirectUri: `${window.location.origin}/${AppRoutes.auth}`,
          postLogoutRedirectUri: `${window.location.origin}/${AppRoutes.login}`,
          navigateToLoginRequestUrl: false,
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
        },
        system: {
          allowRedirectInIframe: false,
          loggerOptions: {
            loggerCallback: (_level, message, containsPii) => {
              if (!environment.use_sso_azure_entra) {
                return;
              }
              console.log(`${containsPii ? '👤' : '🌐'}`, message);
            },
            piiLoggingEnabled: !environment.production,
            logLevel: environment.use_sso_azure_entra ? LogLevel.Info : null,
          },
        },
      }),
      {
        interactionType: isIframed()
          ? InteractionType.Popup
          : InteractionType.Redirect,
      },
      {
        protectedResourceMap: new Map([
          [
            'https://graph.microsoft.com/v1.0/me',
            ['openid, offline_access, User.read'],
          ],
          // list open endpoints here first, without scopes
          [`${environment.url_121_service_api}${ApiPath.usersLogin}`, null],
          // then catch all other protected endpoints with this wildcard
          [
            `${environment.url_121_service_api}/*`,
            [`api://${environment.azure_ad_client_id}/User.read`],
          ],
        ]),
        interactionType: isIframed()
          ? InteractionType.Popup
          : InteractionType.Redirect,
      },
    ),
  ],
  exports: [TranslateModule],
  providers: [
    LoggingService,
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [TranslateService, Injector],
      multi: true,
    },
    ErrorHandlerService,
    ...ssoInterceptors,
    MsalService,
    MsalBroadcastService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
