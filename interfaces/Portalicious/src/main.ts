/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '~/app.component';
import { getAppConfig } from '~/app.config';
import { registerChartDefaults } from '~/utils/chart';
import { changeLanguage, getLocaleForInitialization } from '~/utils/locale';
import { environment } from '~environment';

registerChartDefaults();

const localeInitialization = getLocaleForInitialization({
  defaultLocale: environment.defaultLocale,
  urlLocale: window.location.pathname.split('/')[1],
});

if (localeInitialization.localeIsOutOfSyncWithUrl) {
  // Local storage locale takes precedence over locale in URL - even when the user has never visited the site before.
  // This faciltates copy-pasting of URLs between colleagues with different locales
  // But it also means that the only way to change language is via the language dropdown
  const locale = localeInitialization.localStorageLocale;
  console.log(`Redirecting user to their preferred locale: ${locale}`);
  changeLanguage(locale);
} else {
  bootstrapApplication(
    AppComponent,
    getAppConfig(localeInitialization.locale),
  ).catch((err: unknown) => {
    console.error(err);
  });
}
