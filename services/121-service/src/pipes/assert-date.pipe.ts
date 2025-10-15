import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';
import { isDate, isNil } from 'lodash';

interface Options {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
  allowFuture?: boolean;
}

@Injectable()
export class AssertDatePipe implements PipeTransform<Date> {
  protected exceptionFactory: (error: string) => any;

  constructor(protected readonly options: Options) {
    // We do a lot of checks here to make sure this pipe is not used instead of
    // the builtin parseDatePipe. This custom pipe should only be used when
    // additional checks are needed. Using it *without* stating which additional
    // check is not useful.

    // Type checking here is difficult. Runtime is enough.
    const optionsPassed = Object.keys(options);
    const numberOfOptionsPassed = optionsPassed.length;

    const noOptionsPassed = numberOfOptionsPassed === 0;
    const onlyOptionalOptionPassed =
      numberOfOptionsPassed === 1 && optionsPassed[0] === 'optional';

    if (noOptionsPassed || onlyOptionalOptionPassed) {
      throw new Error(
        'To use this pipe you must pass an options object with at least one attribute that is not the "optional" option.',
      );
    }

    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  public transform(value?: Date): Date | undefined {
    if (isNil(value) && this.options.optional) {
      return value;
    }

    if (!isDate(value)) {
      throw this.exceptionFactory('Validation failed (date value is expected)');
    }

    if (Object.keys(this.options).includes('allowFuture')) {
      // We know better than TypeScript here.
      const allowFuture = this.options.allowFuture as boolean;

      if (!allowFuture && this.isFutureDate(value)) {
        throw this.exceptionFactory(
          'Validation failed (future dates are not allowed)',
        );
      }
    }

    return value;
  }

  private isFutureDate(value: Date): boolean {
    return value > new Date();
  }
}
