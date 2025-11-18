import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { languageCodesToLinguonymsForArab } from '~/services/linguonyms/arab';
import { languageCodesToLinguonymsForDutch } from '~/services/linguonyms/dutch';
import { languageCodesToLinguonymsForEnglish } from '~/services/linguonyms/english';
import { languageCodesToLinguonymsForFrench } from '~/services/linguonyms/french';
import { languageCodesToLinguonymsForSlovak } from '~/services/linguonyms/slovak';
import { languageCodesToLinguonymsForSpanish } from '~/services/linguonyms/spanish';
import { RegistrationPreferredLanguageTranslationFull } from '~/types/registration-preferred-language-translation-full.type';
import { getUILanguageFromLocale, Locale } from '~/utils/locale';

// Linguonym = the proper name of a language.
// Just an alias, but better name locally.
export type languageCodeToLinguonym =
  RegistrationPreferredLanguageTranslationFull;

/**
 * This datastructure maps twice:
 * 1: UILanguage
 * 2: RegistrationPreferredLanguage
 *
 * The result is then the name of the preferred language in the given UI
 * language. So for example:
 * - localeToLanguageNames['nl']['de'] === 'Duits'
 * - localeToLanguageNames['en']['de'] === 'German'
 */
export const uiLanguageToLanguageNames: Record<
  UILanguage,
  languageCodeToLinguonym
> = {
  [UILanguage.en]: languageCodesToLinguonymsForEnglish,
  [UILanguage.ar]: languageCodesToLinguonymsForArab,
  [UILanguage.nl]: languageCodesToLinguonymsForDutch,
  [UILanguage.es]: languageCodesToLinguonymsForSpanish,
  [UILanguage.fr]: languageCodesToLinguonymsForFrench,
  [UILanguage.sk]: languageCodesToLinguonymsForSlovak,
};

/**
 * This needs to be a service because we lean on Angular's DI to get the current
 * locale.
 */
@Injectable({
  providedIn: 'root',
})
export class GetRegistrationPreferredLanguageNameService {
  private currentLocale = inject<Locale>(LOCALE_ID);

  /**
   * Get the name for a preferred language in the locale of the current user.
   *
   * @param {string} languageCode - The ISO-639 Set 1 language code for which we want a localized name.
   * @return {string} The localized name for the preferred language.
   *
   * @example
   *
   * // returns 'German' in English locale, 'Duits' in Dutch locale etc.
   * getRegistrationPreferredLanguageName('de');
   */
  getRegistrationPreferredLanguageName(
    languageCode: RegistrationPreferredLanguage,
  ): string {
    const UILanguage = getUILanguageFromLocale(this.currentLocale);
    return uiLanguageToLanguageNames[UILanguage][languageCode];
  }
}
