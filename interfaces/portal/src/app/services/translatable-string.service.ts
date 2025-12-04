import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { getUILanguageFromLocale, Locale } from '~/utils/locale';

/**
 * The TranslatableStringService provides methods to translate localized
 * strings.
 *
 * Certain data structures, mostly DTOs in the 121 system use
 * UILanguageTranslation types to store strings in 0..n languages. This service
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
    value: null | number | string | UILanguageTranslation | undefined,
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

    // New name because we've type-narrowed.
    const translationMapping = value;
    if (translationMapping[uiLanguage]) {
      return translationMapping[uiLanguage];
    }

    const fallbackLocaleValue = translationMapping[UILanguage.en];

    if (fallbackLocaleValue) {
      return fallbackLocaleValue;
    }

    // Even the fallback-language is not available.
    // I think TypeScript prevents us from ever reaching this point.
    if (
      typeof translationMapping !== 'object' ||
      Object.keys(translationMapping).length === 0
    ) {
      return undefined;
    }

    // Just the first available language as a last resort.
    return translationMapping[Object.keys(translationMapping)[0] as UILanguage];
  }

  commaSeparatedList({
    values,
    style = 'narrow',
    sortedAlphabetically = true,
  }: {
    values: string[] | UILanguageTranslation[];
    style?: Intl.ListFormatStyle;
    sortedAlphabetically?: boolean;
  }): string {
    const list = values
      .map(this.translate.bind(this))
      .filter((value): value is string => !!value);

    if (sortedAlphabetically) {
      list.sort((a, b) => a.localeCompare(b, this.currentLocale));
    }

    const formatter = new Intl.ListFormat(this.currentLocale, {
      style,
      type: 'conjunction',
    });

    return formatter.format(list);
  }
}
