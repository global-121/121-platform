import { NgModule, Injector, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { LOCATION_INITIALIZED } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicStorageModule } from '@ionic/storage';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import {
  TranslateService,
  TranslateModule,
  TranslateLoader,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { httpInterceptorProviders } from './http-interceptors/index';
import { environment } from 'src/environments/environment';

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
  entryComponents: [],
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
    IonicStorageModule.forRoot(),
  ],
  exports: [TranslateModule],
  providers: [
    StatusBar,
    SplashScreen,
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
