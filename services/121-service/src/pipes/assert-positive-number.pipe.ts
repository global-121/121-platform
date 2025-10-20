import {
  HttpStatus,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';
import {
  ErrorHttpStatusCode,
  HttpErrorByCode,
} from '@nestjs/common/utils/http-error-by-code.util';
import { isNil, isNumber } from 'lodash';

interface Options {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
}

@Injectable()
export class AssertPositiveNumberPipe implements PipeTransform<number> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() protected readonly options?: Options) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  transform(value?: number): number | undefined {
    if (isNil(value) && this.options?.optional) {
      return value;
    }

    // we only allow using this pipe with numbers
    if (!isNumber(value)) {
      throw this.exceptionFactory(
        'Validation failed (numeric value is expected)',
      );
    }

    if (Number(value) <= 0) {
      throw this.exceptionFactory(
        `Validation failed (value ${value} is not a positive number)`,
      );
    }
    return value;
  }
}
