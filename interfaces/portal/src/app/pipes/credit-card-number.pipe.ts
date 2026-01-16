import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'creditCardNumber',
})
export class CreditCardNumberPipe implements PipeTransform {
  transform(value: null | string | undefined, defaultValue = ''): string {
    if (!value || value === '') {
      return defaultValue;
    }

    if (isNaN(Number(value))) {
      return value;
    }

    const chunkSize = 4;
    const splitValue = value.split('');

    const numberOfDashes =
      value.length % chunkSize > 0
        ? Math.floor(value.length / chunkSize)
        : Math.floor(value.length / chunkSize) - 1;

    for (let i = numberOfDashes; i > 0; i--) {
      const dashIndex = chunkSize * i;
      splitValue.splice(dashIndex, 0, '-');
    }

    return splitValue.join().replaceAll(',', '');
  }
}
