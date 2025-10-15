import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';
import { isNil } from 'lodash';
import { isISO8601 } from 'validator';

interface Options {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
}

// This pipe checks if a string is a valid ISO 8601 date string.
// It should be used *before* parseDatePipe in a pipe chain.
@Injectable()
export class AssertIso8601Pipe implements PipeTransform<string> {
  protected exceptionFactory: (error: string) => any;

  constructor(protected readonly options: Options) {
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  public transform(value?: string): string | undefined {
    if (isNil(value)) {
      if (this.options.optional) {
        return value;
      }

      throw this.exceptionFactory('Validation failed (date string expected)');
    }

    if (!isISO8601(value)) {
      throw this.exceptionFactory(
        'Validation failed (ISO 8601 date string is expected)',
      );
    }
    return value;
  }
}
