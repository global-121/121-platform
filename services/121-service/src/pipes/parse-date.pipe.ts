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
import { isNil } from 'lodash';

import { toTypeHelper } from '@121-service/src/utils/to-type.helper';

export interface ParseDatePipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
}

@Injectable()
export class ParseDatePipe implements PipeTransform<number> {
  protected exceptionFactory: (error: string) => any;

  constructor(@Optional() protected readonly options?: ParseDatePipeOptions) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  async transform(value?: string): Promise<Date | undefined> {
    if (isNil(value) && this.options?.optional) {
      return value;
    }

    // We know better than TypeScript here.
    value = value as string;
    const maybeDate = new Date(value);

    if (toTypeHelper(maybeDate) !== 'date') {
      throw this.exceptionFactory('Validation failed (date value is expected)');
    }

    return maybeDate;
  }
}
