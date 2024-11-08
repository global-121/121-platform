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
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';

import { routes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';
import { Locale } from '~/utils/locale';

export function getAppConfig(locale: Locale): ApplicationConfig {
  return {
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideExperimentalZonelessChangeDetection(),
      provideAnimationsAsync(),
      provideHttpClient(withInterceptorsFromDi()),
      provideAngularQuery(
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000 * 60 * 5, // 5 minutes
            },
          },
        }),
      ),
      ...AuthService.APP_PROVIDERS,
      { provide: LOCALE_ID, useValue: locale },
    ],
  };
}
