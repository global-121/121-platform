import { registerLocaleData } from '@angular/common';
import { loadTranslations } from '@angular/localize';

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

  // Fetch translation file
  const json = (await fetch('/assets/messages.' + locale + '.json').then((r) =>
    r.json(),
  )) as { translations: Record<string, string> };

  // Initialize translation
  loadTranslations(json.translations);
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
