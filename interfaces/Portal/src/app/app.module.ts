import { LOCATION_INITIALIZED } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { APP_INITIALIZER, Injectable, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalModule,
  MsalService,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  PublicClientApplication,
} from '@azure/msal-browser';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { USER_KEY } from './auth/auth.service';
import { User } from './models/user.model';
import { ErrorHandlerService } from './services/error-handler.service';
import { LoggingService } from './services/logging.service';

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

@Injectable()
export class MsalSkipInterceptor
  extends MsalInterceptor
  implements HttpInterceptor
{
  override intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Only potentially skip on 121-service API requests
    if (request.url.includes(environment.url_121_service_api)) {
      // Never skip on request to get current user, as we need it always to check if user is an Entra user
      if (request.url.includes('users/current')) {
        return super.intercept(request, next);
      }

      // Otherwise, get user from local storage
      const rawUser = localStorage.getItem(USER_KEY);
      if (!rawUser) {
        // If no user found (this should never happen), then skip to avoid SSO-redirect, and let it fail somewhere else
        return next.handle(request);
      }
      // If user found ..
      const user = JSON.parse(rawUser) as User;
      // .. skip if not an entra-user
      if (user?.isEntraUser === false) {
        return next.handle(request);
      }
      // .. otherwise don't skip
      return super.intercept(request, next);
    }
    return next.handle(request);
  }
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
          redirectUri: 'http://localhost:8888/auth',
          postLogoutRedirectUri: 'http://localhost:8888/login',
          navigateToLoginRequestUrl: false,
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          storeAuthStateInCookie: true, // set to true for IE 11
        },
        system: {
          loggerOptions: {
            // loggerCallback: (level, message, containsPii) => {
            //   console.log(
            //     'MSAL Logging: ',
            //     LogLevel[level],
            //     message,
            //     containsPii,
            //   );
            // },
            // piiLoggingEnabled: true,
            // logLevel: LogLevel.Info,
          },
        },
      }),
      {
        interactionType: InteractionType.Popup, // MSAL Guard Configuration
      },
      {
        protectedResourceMap: new Map([
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
        ]),
        interactionType: InteractionType.Popup, // MSAL Interceptor Configuration
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalSkipInterceptor,
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
