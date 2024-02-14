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
  MsalGuard,
  MsalInterceptor,
  MsalModule,
  MsalRedirectComponent,
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
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
        // MSAL Configuration
        auth: {
          clientId: '0ecd91af-2c7a-4363-a0b8-284bd5261eac',
          authority:
            'https://login.microsoftonline.com/dfffb37a-55a4-4919-9c93-7028d115eac2',
          redirectUri: 'http://localhost:4200',
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          storeAuthStateInCookie: true, // set to true for IE 11
        },
        system: {
          loggerOptions: {
            loggerCallback: () => {},
            piiLoggingEnabled: false,
          },
        },
      }),
      {
        interactionType: InteractionType.Redirect, // MSAL Guard Configuration
      },
      {
        protectedResourceMap: new Map([
          ['https://graph.microsoft.com/v1.0/me', ['user.read']],
          ['https://api.myapplication.com/users/*', ['customscope.read']],
          ['http://localhost:4200/about/', null],
        ]),
        interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
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
      useClass: MsalInterceptor,
      multi: true,
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule {}
