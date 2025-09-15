import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';
import { isNil } from 'lodash';

import { toTypeHelper } from '@121-service/src/utils/to-type.helper';

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
    //TODO: type check that options has at least one attribute
    if (Object.keys(options).length === 0) {
      throw new Error(
        'To use this pipe you must pass an options object with at least one attribute',
      );
    }
    options = options;
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

    if (toTypeHelper(value) !== 'date') {
      throw this.exceptionFactory('Validation failed (date value is expected)');
    }

    // We know better than TypeScript here.
    value = value as Date;

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
