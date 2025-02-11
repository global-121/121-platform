import { isDevMode } from '@angular/core';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { environment } from '~environment';

const LOCAL_STORAGE_LOCALE_KEY = 'preferredLanguage';

export enum Locale {
  ar = 'ar',
  en = 'en-GB', // this has to be en-GB otherwise angular locale stuff doesn't work
  es = 'es',
  fr = 'fr',
  nl = 'nl',
}

export const getLocaleLabel = (locale: Locale): string => {
  // NOTE: These labels are never-to-be-translated, they need to appear in their own language for easier recognition by users.
  const localeLabels = {
    [Locale.ar]: 'العربية',
    [Locale.en]: 'English',
    [Locale.es]: 'Español',
    [Locale.fr]: 'Français',
    [Locale.nl]: 'Nederlands',
  };

  return localeLabels[locale];
};

export const getAvailableLanguages = () =>
  environment.locales
    .split(',')
    .map((locale) => locale.trim())
    .filter(isValidLocale)
    .map((locale) => ({
      label: getLocaleLabel(locale),
      value: locale,
    }));

export const getLanguageEnumFromLocale = (locale: Locale): LanguageEnum => {
  switch (locale) {
    case Locale.en:
      return LanguageEnum.en;
    default:
      return LanguageEnum[locale];
  }
};

const isValidLocale = (locale: string): locale is Locale =>
  Object.values(Locale).includes(locale as Locale);

export const getLocaleForInitialization = ({
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
    } => {
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
};

export const changeLanguage = (desiredLocale: Locale): void => {
  // persist locale in locale storage
  localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, desiredLocale);

  // redirect to desired locale
  const pathnameArray = window.location.pathname.split('/');
  pathnameArray[1] = desiredLocale;
  window.location.pathname = pathnameArray.join('/');
};
