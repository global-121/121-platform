import { inject, Pipe, PipeTransform } from '@angular/core';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { TranslatableStringService } from '~/services/translatable-string.service';

@Pipe({
  name: 'translatableString',
})
export class TranslatableStringPipe implements PipeTransform {
  private translatableStringService = inject(TranslatableStringService);

  transform(
    value: null | string | UILanguageTranslation | undefined,
    defaultValue = '',
  ): string {
    const extractedValue = this.translatableStringService.translate(value);

    if (!extractedValue || extractedValue === '') {
      return defaultValue;
    }

    return extractedValue;
  }
}
