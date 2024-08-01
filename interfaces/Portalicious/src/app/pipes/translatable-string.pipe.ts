import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { Locale } from '~/utils/locale';

@Pipe({
  name: 'translatableString',
  standalone: true,
})
export class TranslatableStringPipe implements PipeTransform {
  private fallbackLocale = Locale.en;
  private currentLocale = inject(LOCALE_ID);

  transform(value: null | Record<string, string> | string | undefined) {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value[this.currentLocale]) {
      return value[this.currentLocale];
    }

    if (value[this.fallbackLocale]) {
      return value[this.fallbackLocale];
    }

    // If even the fallback-language is not available, return any other language's value
    if (typeof value === 'object' && Object.keys(value).length > 0) {
      return value[Object.keys(value)[0]];
    }

    return '';
  }
}
