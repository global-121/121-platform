import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';

import { getUILanguageFromLocale, Locale } from '~/utils/locale';

/**
 * The TranslatableStringService provides methods to translate localized
 * strings.
 *
 * Certain data structures, mostly DTOs in the 121 system use
 * UILanguageTranslationPartial types to store strings in 0..n languages. This service
 * can translate those strings. This can be done one by one using the
 * `translate` method, or for lists of strings using the `commaSeparatedList`
 * method.
 */
@Injectable({
  providedIn: 'root',
})
export class TranslatableStringService {
  private currentLocale = inject<Locale>(LOCALE_ID);

  translate(
    value: null | number | string | UILanguageTranslationPartial | undefined,
  ): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    const uiLanguage = getUILanguageFromLocale(this.currentLocale);

    if (value[uiLanguage]) {
      return value[uiLanguage];
    }

    const fallbackLocaleValue = value[UILanguage.en];

    if (fallbackLocaleValue) {
      return fallbackLocaleValue;
    }

    // If even the fallback-language is not available, return any other language's value
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      return value[Object.keys(value)[0] as UILanguage];
    }

    return undefined;
  }

  commaSeparatedList(
    values: string[] | UILanguageTranslationPartial[],
    style: Intl.ListFormatStyle = 'narrow',
  ): string {
    const list = values
      .map(this.translate.bind(this))
      .filter((value): value is string => !!value);

    const formatter = new Intl.ListFormat(this.currentLocale, {
      style,
      type: 'conjunction',
    });

    return formatter.format(list);
  }
}
