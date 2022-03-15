import { LOCATION_INITIALIZED } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  APP_INITIALIZER,
  ErrorHandler,
  Injector,
  NgModule,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
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
import { httpInterceptorProviders } from './http-interceptors/index';
import { ErrorHandlerService } from './services/error-handler.service';
import { LoggingService } from './services/logging.service';

// See : https://github.com/ngx-translate/core/issues/517
export function appInitializerFactory(
  translate: TranslateService,
  injector: Injector,
) {
  return () =>
    new Promise<any>(async (resolve: any) => {
      await injector.get(LOCATION_INITIALIZED, Promise.resolve(null));

      const defaultLang = 'en';
      translate.setDefaultLang(defaultLang);

      // Pre-load all available locales:
      const enabledLocales = environment.locales.trim().split(/\s*,\s*/);
      const loadingLocales = enabledLocales.map(async (locale: string) => {
        return translate.use(locale).toPromise();
      });
      await Promise.all(loadingLocales);

      // Return to default
      await translate.use(defaultLang).toPromise();

      resolve(null);
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
      enabled: true, //environment.useServiceWorker && environment.production,
      registrationStrategy: 'registerWhenStable',
    }),
  ],
  exports: [TranslateModule],
  providers: [
    LoggingService,
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    httpInterceptorProviders,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [TranslateService, Injector],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
