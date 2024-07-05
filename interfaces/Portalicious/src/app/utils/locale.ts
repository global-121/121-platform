import { registerLocaleData } from '@angular/common';
import { loadTranslations } from '@angular/localize';
import { xliffToJson } from '~/utils/xliff-to-json';

export const localStorageLocaleKey = 'preferredLanguage';

export function getStoredLanguage(): string {
  return localStorage.getItem(localStorageLocaleKey) ?? 'en';
}

export async function initLanguage(): Promise<void> {
  const locale = getStoredLanguage();

  if (locale === 'en') {
    // Default behavior, no changes required
    return;
  }

  // Fetch XLIFF translation file and transform to JSON format (JSON translations can be used directly)
  const json = await fetch('/assets/messages.' + locale + '.xlf')
    .then((r) => r.text())
    .then((t) => xliffToJson(t));

  // Initialize translation
  loadTranslations(json);
  $localize.locale = locale;

  let localeModule;

  switch (locale) {
    // Dynamic imports cannot use variables, so we need to use
    // a switch statement and hardcode the necessary imports
    case 'nl':
      localeModule = await import(
        '~/../../node_modules/@angular/common/locales/nl'
      );
      break;
    default:
      throw new Error(`Locale ${locale} not supported`);
  }

  registerLocaleData(localeModule.default);
}

export function changeLanguage(desiredLocale: string): void {
  localStorage.setItem(localStorageLocaleKey, desiredLocale);
  window.location.reload();
}
