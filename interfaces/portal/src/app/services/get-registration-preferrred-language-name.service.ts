import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

import { getLinguonym } from '~/utils/get-linguonym';
import { getUILanguageFromLocale, Locale } from '~/utils/locale';

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
    return getLinguonym({
      languageToDisplayNameOf: languageCode,
      languageToShowNameIn: UILanguage,
    });
  }
}
