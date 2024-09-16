import { inject, Injectable, LOCALE_ID } from '@angular/core';

import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { Locale } from '~/utils/locale';

@Injectable({
  providedIn: 'root',
})
export class TranslatableStringService {
  private currentLocale = inject(LOCALE_ID);

  translate(
    value: LocalizedString | null | string | undefined,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    const locale = this.currentLocale;

    if (value[locale]) {
      return value[locale];
    }

    const fallbackLocale = Locale.en;

    if (value[fallbackLocale]) {
      return value[fallbackLocale];
    }

    // If even the fallback-language is not available, return any other language's value
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      return value[Object.keys(value)[0]];
    }

    return undefined;
  }
}
