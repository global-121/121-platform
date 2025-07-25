import { FormatWidth, getLocaleDateFormat } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
} from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { providePrimeNG } from 'primeng/config';

import { routes } from '~/app.routes';
import AppTheme from '~/app.theme';
import { CustomPageTitleStrategy } from '~/app.title-strategy';
import { AuthService } from '~/services/auth.service';
import { TrackingService } from '~/services/tracking.service';
import { Locale } from '~/utils/locale';

export const getAppConfig = (locale: Locale): ApplicationConfig => ({
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAngularSvgIcon(),
    providePrimeNG({
      theme: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- AppTheme is typed as any in primeng
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
        // eslint-disable-next-line @typescript-eslint/no-deprecated -- Could not find a valid replacement
        dateFormat: getLocaleDateFormat(
          locale,
          // eslint-disable-next-line @typescript-eslint/no-deprecated -- Could not find a valid replacement
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
    ...TrackingService.APP_PROVIDERS,
    { provide: TitleStrategy, useClass: CustomPageTitleStrategy },
    { provide: LOCALE_ID, useValue: locale },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'XXX' },
  ],
});
