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
import { provideRouter } from '@angular/router';

import { routes } from '~/app.routes';
import { getStoredLanguage } from '~/utils/locale';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideExperimentalZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: getStoredLanguage() },
  ],
};
