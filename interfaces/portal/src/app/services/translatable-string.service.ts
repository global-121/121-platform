import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { getLanguageEnumFromLocale, Locale } from '~/utils/locale';

@Injectable({
  providedIn: 'root',
})
export class TranslatableStringService {
  private currentLocale = inject<Locale>(LOCALE_ID);

  translate(
    value: LocalizedString | null | number | string | undefined,
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

    const languageEnumLocale = getLanguageEnumFromLocale(this.currentLocale);

    if (value[languageEnumLocale]) {
      return value[languageEnumLocale];
    }

    const fallbackLocaleValue = value[UILanguageEnum.en];

    if (fallbackLocaleValue) {
      return fallbackLocaleValue;
    }

    // If even the fallback-language is not available, return any other language's value
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      return value[Object.keys(value)[0] as UILanguageEnum];
    }

    return undefined;
  }

  commaSeparatedList(
    values: LocalizedString[] | string[],
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
