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

export interface ParsePositiveNumberPipeOptions {
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
  optional?: boolean;
}

@Injectable()
export class ParsePositiveNumberPipe implements PipeTransform<number> {
  protected exceptionFactory: (error: string) => any;

  constructor(
    @Optional() protected readonly options?: ParsePositiveNumberPipeOptions,
  ) {
    options = options || {};
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } =
      options;

    this.exceptionFactory =
      exceptionFactory ||
      ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  async transform(value?: number): Promise<number | undefined> {
    if (isNil(value) && this.options?.optional) {
      return value;
    }

    // we only allow using this pipe with numbers
    if (toTypeHelper(value) !== 'number') {
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
