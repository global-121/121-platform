import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  QueryClient,
  provideAngularQuery,
} from '@tanstack/angular-query-experimental';

import { routes } from '~/app.routes';
import { Locale } from '~/utils/locale';

export function getAppConfig(locale: Locale): ApplicationConfig {
  return {
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideExperimentalZonelessChangeDetection(),
      provideAnimationsAsync(),
      provideHttpClient(withInterceptorsFromDi()),
      provideAngularQuery(new QueryClient()),
      { provide: LOCALE_ID, useValue: locale },
    ],
  };
}
