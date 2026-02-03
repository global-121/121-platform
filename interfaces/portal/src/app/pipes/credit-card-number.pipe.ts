import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'creditCardNumber',
})
export class CreditCardNumberPipe implements PipeTransform {
  transform(value: null | string | undefined, defaultValue = ''): string {
    if (!value) {
      return defaultValue;
    }

    if (isNaN(Number(value))) {
      return value;
    }

    return value.match(/.{1,4}/g)?.join('-') ?? value;
  }
}
