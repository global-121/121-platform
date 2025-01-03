import { FormatWidth, getLocaleDateFormat } from '@angular/common';
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
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { providePrimeNG } from 'primeng/config';

import { routes } from '~/app.routes';
import AppTheme from '~/app.theme';
import { AuthService } from '~/services/auth.service';
import { Locale } from '~/utils/locale';

export function getAppConfig(locale: Locale): ApplicationConfig {
  return {
    providers: [
      provideRouter(routes, withComponentInputBinding()),
      provideExperimentalZonelessChangeDetection(),
      provideAnimationsAsync(),
      provideHttpClient(withInterceptorsFromDi()),
      providePrimeNG({
        theme: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          preset: AppTheme,
          options: {
            // disable dark mode (for now)
            darkModeSelector: false,
            cssLayer: {
              name: 'primeng',
              order:
                'tailwind-base, primeng, primeng-customisations, tailwind-utilities',
            },
          },
        },
        translation: {
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          dateFormat: getLocaleDateFormat(
            locale,
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            FormatWidth.Short,
          ).toLowerCase(), // toLowerCase because PrimeNG otherwise interprets DD and MM as "name of day" and "name of month"
          apply: $localize`:@@generic-apply:Apply`,
          clear: $localize`:@@generic-clear:Clear`,
        },
      }),
      provideTanStackQuery(
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
