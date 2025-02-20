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
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
} from '@angular/router';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { provideMatomo, withRouter } from 'ngx-matomo-client';
import { providePrimeNG } from 'primeng/config';

import { AppRoutes, routes } from '~/app.routes';
import AppTheme from '~/app.theme';
import { CustomPageTitleStrategy } from '~/app.title-strategy';
import { AuthService } from '~/services/auth.service';
import { Locale } from '~/utils/locale';
import { environment } from '~environment';

import { parseMatomoConnectionString } from '../../_matomo.utils.mjs';

export const getAppConfig = (locale: Locale): ApplicationConfig => ({
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideExperimentalZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
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
    { provide: TitleStrategy, useClass: CustomPageTitleStrategy },
    { provide: LOCALE_ID, useValue: locale },
    environment.matomo_connection_string
      ? provideMatomo(
          {
            siteId: Number(
              parseMatomoConnectionString(environment.matomo_connection_string)
                .id ?? 0,
            ),
            trackerUrl: String(
              parseMatomoConnectionString(environment.matomo_connection_string)
                .api ?? '',
            ),
            acceptDoNotTrack: true,
            disabled: !environment.production, // NOTE: To debug tracking locally, omit or set to `false`
            enableJSErrorTracking: true,
            requireConsent: 'none',
            runOutsideAngularZone: true,
          },
          withRouter({
            exclude: [new RegExp(AppRoutes.authCallback)],
          }),
        )
      : [],
  ],
});
