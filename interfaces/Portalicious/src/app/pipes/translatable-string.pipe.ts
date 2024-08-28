import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Pipe({
  name: 'translatableString',
  standalone: true,
})
export class TranslatableStringPipe implements PipeTransform {
  private translatableStringService = inject(TranslatableStringService);

  transform(
    value: null | Record<string, string> | string | undefined,
    defaultValue = '',
  ): string {
    const extractedValue = this.translatableStringService.translate(value);

    if (!extractedValue || extractedValue === '') {
      return defaultValue;
    }

    return extractedValue;
  }
}
