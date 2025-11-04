import { isDevMode } from '@angular/core';

import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';

import { environment } from '~environment';

/**
 * "locale" in this file always refers to Angular locale IDs, e.g. "en-GB",
 * "fr", "nl", etc.
 *
 * We convert these into UILanguageEnum values where we communicate through the
 * browser or emails we send to users of the portal.
 *
 * Registrations have a preferredLanguage field which we do **not** convert to
 * UILanguageEnum values.
 */

// TODO: rename this to selectedUILanguage.
const LOCAL_STORAGE_LOCALE_KEY = 'preferredLanguage';

// NOTE: Make sure to align these languages with ALL_AVAILABLE_LOCALES in '_all_available-locales.mjs'
export enum Locale {
  ar = 'ar',
  en = 'en-GB', // this has to be en-GB otherwise angular locale stuff doesn't work
  es = 'es',
  fr = 'fr',
  nl = 'nl',
  sk = 'sk',
}

export const getLocaleLabel = (locale: Locale): string => {
  // NOTE: These labels are never-to-be-translated, they need to appear in their own language for easier recognition by users.
  const localeLabels = {
    [Locale.ar]: 'العربية',
    [Locale.en]: 'English',
    [Locale.es]: 'Español',
    [Locale.fr]: 'Français',
    [Locale.nl]: 'Nederlands',
    [Locale.sk]: 'Slovenčina',
  };

  return localeLabels[locale];
};

export const getAvailableUILanguages = () =>
  environment.locales
    .split(',')
    .map((locale) => locale.trim())
    .filter(isValidLocale)
    .map((locale) => ({
      label: getLocaleLabel(locale),
      value: locale,
    }));

/**
 * @param {string} locale - Angular locale id
 * @return {string} UILanguageEnum
 */
export const getUILanguageEnumFromLocale = (locale: Locale): UILanguageEnum => {
  switch (locale) {
    case Locale.en:
      return UILanguageEnum.en;
    default:
      return UILanguageEnum[locale];
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

  const localStorageLocale =
    localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY) ?? defaultLocale;

  if (!isValidLocale(localStorageLocale)) {
    // This in theory should never happen
    // But to be on the safe side, we revert to locale in URL
    localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, urlLocale);
    return { locale: urlLocale };
  }

  if (urlLocale !== localStorageLocale) {
    return {
      localStorageLocale,
      localeIsOutOfSyncWithUrl: true,
    };
  }

  return { locale: localStorageLocale };
};

/**
 * Changes the locale in localStorage and redirects to the URL with the desired
 * locale.
 *
 * @param {string} desiredLocale - Angular locale id
 */
export const changeUILanguage = (desiredLocale: Locale): void => {
  // persist locale in locale storage
  localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, desiredLocale);

  // redirect to desired locale
  const pathnameArray = window.location.pathname.split('/');
  pathnameArray[1] = desiredLocale;
  window.location.pathname = pathnameArray.join('/');
};
