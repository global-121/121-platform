import { isDevMode } from '@angular/core';

const LOCAL_STORAGE_LOCALE_KEY = 'preferredLanguage';

export enum Locale {
  en = 'en',
  nl = 'nl',
}

export function getLocaleLabel(locale: Locale): string {
  switch (locale) {
    case Locale.en:
      return 'English';
    case Locale.nl:
      return 'Nederlands';
  }
}

function isValidLocale(locale: string): locale is Locale {
  return Object.values(Locale).includes(locale as Locale);
}

export function getLocaleForInitialization({
  defaultLocale,
  urlLocale,
}: {
  defaultLocale: string;
  urlLocale: string;
}):
  | {
      locale: Locale;
      localeIsOutOfSyncWithUrl?: false;
    }
  | {
      localStorageLocale: Locale;
      localeIsOutOfSyncWithUrl: true;
    } {
  if (!isValidLocale(defaultLocale)) {
    // This should never happen, but it could be set incorrectly in ENV variables
    throw new Error(
      `Invalid default locale "${defaultLocale}" found in environment.`,
    );
  }

  if (isDevMode()) {
    return { locale: defaultLocale };
  }

  if (!isValidLocale(urlLocale)) {
    // This should never happen, as the server cannot serve a page with an invalid locale
    // Mainly throwing this error to make TS know that urlLocale is a valid Locale from now on
    throw new Error(
      `Invalid locale "${urlLocale}" found in URL: ${window.location.pathname}`,
    );
  }

  const localStorageLanguage =
    localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY) ?? defaultLocale;

  if (!isValidLocale(localStorageLanguage)) {
    // This in theory should never happen
    // But to be on the safe side, we revert to locale in URL
    localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, urlLocale);
    return { locale: urlLocale };
  }

  if (urlLocale !== localStorageLanguage) {
    return {
      localStorageLocale: localStorageLanguage,
      localeIsOutOfSyncWithUrl: true,
    };
  }

  return { locale: localStorageLanguage };
}

export function changeLanguage(desiredLocale: Locale): void {
  // persist locale in locale storage
  localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, desiredLocale);

  // redirect to desired locale
  const pathnameArray = window.location.pathname.split('/');
  pathnameArray[1] = desiredLocale;
  window.location.pathname = pathnameArray.join('/');
}
