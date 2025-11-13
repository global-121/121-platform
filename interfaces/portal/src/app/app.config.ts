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
  MutationCache,
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

declare module '@tanstack/angular-query-experimental' {
  interface Register {
    mutationMeta: {
      invalidateCacheAgainAfterDelay?: number;
    };
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
  mutationCache: new MutationCache({
    // eslint-disable-next-line max-params -- we don't control this function signature
    onSuccess: async (_data, _variables, _context, mutation) => {
      await queryClient.invalidateQueries();

      if (!mutation.options.meta?.invalidateCacheAgainAfterDelay) {
        return;
      }

      // Some requests have a slight delay between a mutation
      // response and the moment the updated data is available in queries.
      // To accommodate for this, we invalidate queries a second time after
      // a short delay.
      setTimeout(() => {
        void queryClient.invalidateQueries();
      }, mutation.options.meta.invalidateCacheAgainAfterDelay);
    },
  }),
});

export const getAppConfig = (locale: Locale): ApplicationConfig => ({
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideZonelessChangeDetection(),
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- this is needed by primeng for now https://github.com/primefaces/primeng/issues/18803
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAngularSvgIcon(),
    providePrimeNG({
      theme: {
        preset: AppTheme,
        options: {
          // disable dark mode (for now)
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, primeng-customisations',
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
    provideTanStackQuery(queryClient),
    ...AuthService.APP_PROVIDERS,
    ...TrackingService.APP_PROVIDERS,
    { provide: TitleStrategy, useClass: CustomPageTitleStrategy },
    { provide: LOCALE_ID, useValue: locale },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'XXX' },
  ],
});
